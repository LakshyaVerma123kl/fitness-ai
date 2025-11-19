import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ⚡ CONFIG: FREE AI providers with generous free tiers
const PROVIDERS = [
  { provider: "gemini", model: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { provider: "gemini", model: "gemini-3-pro-preview", name: "Gemini 3 Pro" },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B",
  },
  {
    provider: "huggingface",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    name: "HuggingFace Llama 3.3",
  },
];

// Helper: Call Groq API
async function callGroq(prompt: string, model: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not found");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional fitness trainer and nutritionist. Return ONLY valid JSON with no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Groq Error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper: Call HuggingFace API
async function callHuggingFace(prompt: string, model: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not found");

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2500,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace Error: ${error}`);
  }

  const data = await response.json();
  return data[0]?.generated_text || data.generated_text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      age,
      gender,
      weight,
      height,
      goal,
      level,
      diet,
      equipment,
      medicalHistory,
      stressLevel,
    } = body;

    // Validate Required Fields
    if (!age || !weight || !height) {
      return NextResponse.json(
        { error: "Age, Weight, and Height are required" },
        { status: 400 }
      );
    }

    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // Create Enhanced Prompt
    const prompt = `You are a professional fitness trainer and nutritionist. Create a personalized fitness and diet plan in JSON format.

User Profile:
- Name: ${name || "User"}
- Age: ${age} years
- Gender: ${gender || "Not specified"}
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi}
- Goal: ${goal}
- Fitness Level: ${level}
- Diet Type: ${diet}
- Equipment: ${equipment}
- Stress Level: ${stressLevel || "Medium"}
${medicalHistory ? `- Medical History/Injuries: ${medicalHistory}` : ""}

INSTRUCTIONS:
- Return ONLY valid JSON
- NO markdown, NO backticks, NO explanations
- Start directly with {
- Consider the user's medical history and stress level in your recommendations
- Include rest days and recovery tips
- Provide portion sizes in diet plan

JSON Structure:
{
  "motivation_quote": "Inspiring personalized quote based on user's goal and level",
  "tips": [
    "Lifestyle tip 1",
    "Posture tip",
    "Recovery tip"
  ],
  "workout": [
    {
      "day": "Monday",
      "focus": "Upper Body",
      "warmup": "5-10 min cardio + dynamic stretches",
      "exercises": [
        { "name": "Push-ups", "sets": "3", "reps": "15", "rest": "60s" }
      ],
      "cooldown": "5 min stretching"
    }
  ],
  "diet": {
    "breakfast": { 
      "meal": "Oatmeal with fruits and nuts", 
      "calories": "400",
      "portion": "1 cup oats, 1 banana, handful nuts",
      "protein": "15g",
      "carbs": "60g",
      "fats": "12g"
    },
    "lunch": { 
      "meal": "Grilled chicken salad", 
      "calories": "600",
      "portion": "200g chicken, 2 cups vegetables",
      "protein": "45g",
      "carbs": "30g",
      "fats": "20g"
    },
    "snack": {
      "meal": "Greek yogurt with berries",
      "calories": "200",
      "portion": "1 cup yogurt, 1/2 cup berries",
      "protein": "20g",
      "carbs": "25g",
      "fats": "5g"
    },
    "dinner": { 
      "meal": "Salmon with quinoa and vegetables", 
      "calories": "550",
      "portion": "150g salmon, 1 cup quinoa, 2 cups vegetables",
      "protein": "40g",
      "carbs": "50g",
      "fats": "18g"
    }
  },
  "daily_calories": "1750-1800",
  "hydration": "8-10 glasses of water daily"
}

Requirements:
- Create 3-4 workout days with 1 rest day
- 4-6 exercises per workout for ${level} level
- Match exercises to ${equipment} availability
- Follow ${diet} dietary restrictions strictly
- Align calories with ${goal} (deficit for weight loss, surplus for muscle gain)
- If medical history mentions injuries, avoid exercises that could aggravate them
- Consider ${stressLevel} stress level in workout intensity`;

    // 🔄 Multi-Provider FREE Fallback Loop
    let lastError = null;

    for (let i = 0; i < PROVIDERS.length; i++) {
      const { provider, model, name: providerName } = PROVIDERS[i];

      try {
        let responseText = "";

        if (provider === "gemini") {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            continue;
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const geminiModel = genAI.getGenerativeModel({ model });
          const result = await geminiModel.generateContent(prompt);
          const response = await result.response;
          responseText = response.text();
        } else if (provider === "groq") {
          if (!process.env.GROQ_API_KEY) {
            continue;
          }

          responseText = await callGroq(prompt, model);
        } else if (provider === "huggingface") {
          if (!process.env.HUGGINGFACE_API_KEY) {
            continue;
          }

          responseText = await callHuggingFace(prompt, model);
        }

        // Clean Response
        let cleanedText = responseText.trim();
        cleanedText = cleanedText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .replace(/`/g, "");

        // Extract JSON object only
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("No valid JSON found in response");
        }

        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

        // Parse JSON

        const parsedData = JSON.parse(cleanedText);

        // Validate Structure
        if (!parsedData.workout || !Array.isArray(parsedData.workout)) {
          throw new Error("Invalid workout structure");
        }

        if (!parsedData.diet || typeof parsedData.diet !== "object") {
          throw new Error("Invalid diet structure");
        }

        return NextResponse.json({
          ...parsedData,
          _provider: providerName,
          _bmi: bmi,
        });
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(`⚠️ ${providerName} failed. Reason: ${errorMsg}`);

        if (i === PROVIDERS.length - 1) {
          console.error("❌ All providers exhausted");
          break;
        }

        const delay = 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `All providers failed. Last error: ${
        lastError?.message || "Unknown error"
      }`
    );
  } catch (error: any) {
    console.error("\n❌❌❌ FINAL API ERROR ❌❌❌");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to generate plan with all AI providers",
        details: error.message,
        suggestion:
          "Please configure at least one FREE API key: Gemini, Groq, or HuggingFace",
      },
      { status: 500 }
    );
  }
}
