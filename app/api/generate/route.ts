import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================

// Free tier providers with fallback logic
const PROVIDERS = [
  { provider: "gemini", model: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { provider: "gemini", model: "gemini-pro", name: "Gemini Pro" },
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

// ==========================================
// 🔌 API HELPERS
// ==========================================

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
              "You are an expert fitness coach. Return ONLY valid JSON. Do not include markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3500,
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
          max_new_tokens: 3500,
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

// ==========================================
// 🚀 MAIN ROUTE HANDLER
// ==========================================

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

    // Basic Physics Validation
    if (!age || !weight || !height) {
      return NextResponse.json(
        { error: "Age, Weight, and Height are required to calculate plans." },
        { status: 400 }
      );
    }

    // Calculate BMI locally to assist the AI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // 🧠 THE MEGA PROMPT
    const prompt = `You are an elite Personal Trainer and Nutritionist.
    Generate a highly detailed, JSON-only response. No markdown, no intro text.
    
    USER PROFILE:
    - Name: ${name || "Athlete"}
    - Bio: ${age}yrs, ${gender}, ${weight}kg, ${height}cm (BMI: ${bmi})
    - Goal: ${goal}
    - Experience: ${level}
    - Diet Pref: ${diet}
    - Access: ${equipment}
    - Stress: ${stressLevel || "Average"}
    ${medicalHistory ? `- Medical Notes: ${medicalHistory}` : ""}

    REQUIREMENTS:
    1. RESULTS TIMELINE: Be honest. When will they see changes?
    2. DIET STRATEGY: Explain how Week 1 differs from Week 2 (e.g., adaptation vs optimization).
    3. WORKOUT: 3-5 days based on level.
    4. MACROS: Calculate specific grams for Protein/Carbs/Fats.
    
    REQUIRED JSON STRUCTURE:
    {
      "motivation_quote": "Short, punchy quote",
      "results_timeline": {
        "estimated_start": "e.g., 3-4 weeks",
        "milestones": [
          "Week 2: Energy levels stabilize",
          "Week 4: Visible definition / weight change",
          "Week 8: Significant transformation"
        ]
      },
      "tips": ["Tip 1", "Tip 2", "Tip 3"],
      "workout": [
        {
          "day": "Day 1",
          "focus": "Push / Pull / Legs etc",
          "exercises": [
            { "name": "Exercise Name", "sets": "3", "reps": "10-12", "rest": "60s" }
          ]
        }
      ],
      "diet": {
        "strategy": {
          "week_1": "Focus on...",
          "week_2": "Shift focus to..."
        },
        "macros": {
          "protein": "150g",
          "carbs": "200g",
          "fats": "60g"
        },
        "meals": {
          "breakfast": { 
            "meal": "Name of meal", 
            "calories": "400", 
            "protein": "30g", "carbs": "40g", "fats": "10g",
            "portion": "Exact ingredients (e.g., 2 eggs, 1 slice toast)"
          },
          "lunch": { 
            "meal": "Name of meal", 
            "calories": "600",
            "protein": "40g", "carbs": "50g", "fats": "20g",
            "portion": "Exact ingredients"
          },
          "snack": { 
             "meal": "Name of meal", 
             "calories": "200",
             "protein": "15g", "carbs": "20g", "fats": "5g",
             "portion": "Exact ingredients"
          },
          "dinner": { 
             "meal": "Name of meal", 
             "calories": "500",
             "protein": "35g", "carbs": "40g", "fats": "15g",
             "portion": "Exact ingredients"
          }
        }
      },
      "supplements": ["Creatine", "Whey Protein", "Multivitamin"],
      "daily_calories": "Total Kcal"
    }`;

    // 🔄 Provider Fallback Logic
    let lastError = null;

    for (let i = 0; i < PROVIDERS.length; i++) {
      const { provider, model, name: providerName } = PROVIDERS[i];

      try {
        let responseText = "";

        // 1. GEMINI
        if (provider === "gemini") {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) continue;

          const genAI = new GoogleGenerativeAI(apiKey);
          const geminiModel = genAI.getGenerativeModel({ model });
          const result = await geminiModel.generateContent(prompt);
          const response = await result.response;
          responseText = response.text();
        }
        // 2. GROQ
        else if (provider === "groq") {
          if (!process.env.GROQ_API_KEY) continue;
          responseText = await callGroq(prompt, model);
        }
        // 3. HUGGING FACE
        else if (provider === "huggingface") {
          if (!process.env.HUGGINGFACE_API_KEY) continue;
          responseText = await callHuggingFace(prompt, model);
        }

        // 🧹 CLEAN & PARSE RESPONSE
        // AI sometimes adds ```json or text before/after. We strip it.
        let cleanedText = responseText.trim();
        cleanedText = cleanedText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .replace(/`/g, "");

        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("No valid JSON found in AI response");
        }

        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        const parsedData = JSON.parse(cleanedText);

        // 🛡️ STRUCTURE VALIDATION
        if (!parsedData.workout || !Array.isArray(parsedData.workout)) {
          throw new Error("Invalid workout structure received");
        }
        if (!parsedData.diet || !parsedData.diet.meals) {
          throw new Error("Invalid diet structure received");
        }

        // ✅ SUCCESS
        return NextResponse.json({
          ...parsedData,
          _provider: providerName,
          _bmi: bmi,
          _generatedAt: new Date().toISOString(),
        });
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(`⚠️ ${providerName} failed: ${errorMsg}`);

        // If this was the last provider, break the loop
        if (i === PROVIDERS.length - 1) {
          break;
        }

        // Slight delay before retrying next provider
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // ❌ FAILURE
    console.error("❌ All AI providers failed");
    return NextResponse.json(
      {
        error: "Unable to generate plan. Please try again later.",
        details: lastError?.message,
        suggestion: "Check API keys in .env or try a simpler request.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("❌ Critical Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
