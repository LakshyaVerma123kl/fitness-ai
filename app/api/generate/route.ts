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
              "You are an expert fitness coach and nutritionist with medical knowledge. Prioritize safety and health. Return ONLY valid JSON. Do not include markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
          max_new_tokens: 4000,
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
      allergies,
      medications,
      injuries,
      chronicConditions,
      sleepHours,
      waterIntake,
      stressLevel,
      activityLevel,
    } = body;

    // Basic Physics Validation
    if (!age || !weight || !height) {
      return NextResponse.json(
        { error: "Age, Weight, and Height are required to calculate plans." },
        { status: 400 }
      );
    }

    // Calculate BMI and BMR locally
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === "Male") {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else if (gender === "Female") {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    } else {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 78);
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
    };

    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));

    // Build comprehensive health context
    const healthContext = [];

    if (allergies) {
      healthContext.push(`🚨 ALLERGIES: ${allergies}`);
    }
    if (chronicConditions) {
      healthContext.push(`⚕️ CHRONIC CONDITIONS: ${chronicConditions}`);
    }
    if (injuries) {
      healthContext.push(`🩹 INJURIES: ${injuries}`);
    }
    if (medications) {
      healthContext.push(`💊 MEDICATIONS: ${medications}`);
    }
    if (medicalHistory) {
      healthContext.push(`📋 MEDICAL NOTES: ${medicalHistory}`);
    }

    const healthInfo =
      healthContext.length > 0
        ? `\n\n⚠️ CRITICAL HEALTH CONSIDERATIONS:\n${healthContext.join(
            "\n"
          )}\n\nYou MUST consider these factors when creating the plan. Modify exercises to accommodate injuries. Exclude allergenic foods. Adjust intensity for chronic conditions. Include safety warnings.`
        : "";

    // 🧠 THE ENHANCED MEGA PROMPT
    const prompt = `You are an elite Personal Trainer, Nutritionist, and Health Professional.
Generate a highly detailed, SAFE, and personalized fitness plan in JSON format only. No markdown, no intro text.

USER PROFILE:
- Name: ${name || "Athlete"}
- Bio: ${age}yrs, ${gender}, ${weight}kg, ${height}cm (BMI: ${bmi})
- BMR: ${bmr} kcal/day | TDEE: ${tdee} kcal/day
- Goal: ${goal}
- Experience: ${level}
- Diet Preference: ${diet}
- Equipment Access: ${equipment}
- Activity Level: ${activityLevel}
- Sleep: ${sleepHours} hours/night
- Water Intake: ${waterIntake}L/day
- Stress Level: ${stressLevel}${healthInfo}

CRITICAL SAFETY REQUIREMENTS:
1. If user has injuries, MODIFY exercises to avoid affected areas
2. If user has chronic conditions (diabetes, hypertension, etc.), adjust intensity and include monitoring advice
3. If user has allergies, EXCLUDE those foods completely from meal plan
4. If user takes medications, consider their effects (e.g., blood thinners = avoid high-risk exercises)
5. Include specific warnings and modifications in the plan

PLAN REQUIREMENTS:
1. SAFETY FIRST: Address all medical concerns explicitly
2. RESULTS TIMELINE: Be honest about when they'll see changes
3. DIET STRATEGY: Week-by-week progression with allergy considerations
4. WORKOUT: 3-5 days with injury modifications if needed
5. MACROS: Calculate based on TDEE and goal (deficit/surplus/maintenance)
6. HYDRATION & RECOVERY: Specific to their lifestyle

REQUIRED JSON STRUCTURE:
{
  "safety_warnings": [
    "Specific warning 1 based on health conditions",
    "Specific warning 2",
    "Consult doctor before starting if X condition present"
  ],
  "motivation_quote": "Short, punchy, personalized quote",
  "results_timeline": {
    "estimated_start": "e.g., 2-4 weeks (may vary with medical conditions)",
    "milestones": [
      "Week 2: Initial adaptation phase",
      "Week 4: Visible changes begin",
      "Week 8: Significant transformation",
      "Week 12: Goal milestone achieved"
    ]
  },
  "health_considerations": {
    "modifications": "Specific modifications for injuries/conditions",
    "monitoring": "What to track (blood sugar, blood pressure, pain levels, etc.)",
    "red_flags": "Warning signs to stop and consult doctor"
  },
  "tips": [
    "Tip 1 relevant to their profile",
    "Tip 2 considering health factors",
    "Tip 3 for recovery",
    "Tip 4 for consistency"
  ],
  "workout": [
    {
      "day": "Day 1",
      "focus": "Push / Pull / Legs / Cardio / Recovery",
      "duration": "45-60 mins",
      "intensity": "Low/Moderate/High (adjusted for health)",
      "exercises": [
        { 
          "name": "Exercise Name", 
          "sets": "3", 
          "reps": "10-12", 
          "rest": "60s",
          "calories": "50",
          "modification": "Alternative if user has injury"
        }
      ],
      "notes": "Specific guidance for this workout day"
    }
  ],
  "diet": {
    "strategy": {
      "week_1": "Focus on adaptation, establish eating patterns",
      "week_2": "Optimize macros, increase variety",
      "week_3_4": "Fine-tune based on progress",
      "allergy_notes": "Foods avoided and alternatives used"
    },
    "calorie_target": {
      "daily": "${
        goal === "Weight Loss"
          ? tdee - 500
          : goal === "Muscle Gain"
          ? tdee + 300
          : tdee
      } kcal",
      "explanation": "Why this target based on TDEE and goal"
    },
    "macros": {
      "protein": "Xg (based on body weight and goal)",
      "carbs": "Xg (adjusted for activity and conditions)",
      "fats": "Xg (minimum for hormonal health)"
    },
    "meals": {
      "breakfast": { 
        "meal": "Name of meal", 
        "calories": "400", 
        "protein": "30g", 
        "carbs": "40g", 
        "fats": "15g",
        "portion": "Exact ingredients with measurements",
        "prep_time": "10 mins",
        "allergy_safe": "Yes/No with alternatives"
      },
      "mid_morning_snack": { 
        "meal": "Name", 
        "calories": "150",
        "protein": "10g", 
        "carbs": "15g", 
        "fats": "5g",
        "portion": "Exact ingredients",
        "prep_time": "5 mins"
      },
      "lunch": { 
        "meal": "Name", 
        "calories": "500",
        "protein": "40g", 
        "carbs": "50g", 
        "fats": "20g",
        "portion": "Exact ingredients",
        "prep_time": "15 mins",
        "allergy_safe": "Yes/No with alternatives"
      },
      "afternoon_snack": { 
        "meal": "Name", 
        "calories": "200",
        "protein": "15g", 
        "carbs": "20g", 
        "fats": "8g",
        "portion": "Exact ingredients",
        "prep_time": "5 mins"
      },
      "dinner": { 
        "meal": "Name", 
        "calories": "550",
        "protein": "45g", 
        "carbs": "45g", 
        "fats": "20g",
        "portion": "Exact ingredients",
        "prep_time": "20 mins",
        "allergy_safe": "Yes/No with alternatives"
      },
      "evening_snack": {
        "meal": "Optional light snack",
        "calories": "100",
        "protein": "8g",
        "carbs": "10g",
        "fats": "3g",
        "portion": "Exact ingredients",
        "prep_time": "2 mins"
      }
    }
  },
  "hydration": {
    "target": "Based on their weight and activity (${Math.round(
      weight * 0.033
    )}L minimum)",
    "timing": "When and how much to drink",
    "signs_of_dehydration": ["Dark urine", "Fatigue", "Dizziness"]
  },
  "recovery": {
    "sleep_target": "7-9 hours (they currently get ${sleepHours})",
    "rest_days": "How many per week and why",
    "stress_management": "Techniques based on their ${stressLevel} stress level",
    "stretching": "Daily routine for flexibility and injury prevention"
  },
  "supplements": [
    "Supplement 1 with reason and dosage",
    "Supplement 2 (avoid if on certain medications)",
    "Note: Consult doctor before starting new supplements"
  ],
  "progress_tracking": {
    "measurements": ["Weight", "Body measurements", "Progress photos"],
    "performance": ["Strength gains", "Endurance improvements", "Flexibility"],
    "health_metrics": ["Energy levels", "Sleep quality", "Mood", "Medical markers if applicable"]
  }
}

Generate a comprehensive, safe, and personalized plan now.`;

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

        // 🛡️ ENHANCED STRUCTURE VALIDATION
        if (!parsedData.workout || !Array.isArray(parsedData.workout)) {
          throw new Error("Invalid workout structure received");
        }
        if (!parsedData.diet || !parsedData.diet.meals) {
          throw new Error("Invalid diet structure received");
        }
        if (
          !parsedData.safety_warnings ||
          !Array.isArray(parsedData.safety_warnings)
        ) {
          // Add default safety warning if missing
          parsedData.safety_warnings = [
            "Consult with a healthcare provider before starting any new fitness program.",
          ];
        }

        // ✅ SUCCESS - Add metadata
        return NextResponse.json({
          ...parsedData,
          _metadata: {
            provider: providerName,
            bmi: bmi,
            bmr: bmr,
            tdee: tdee,
            generatedAt: new Date().toISOString(),
            hasHealthConditions: healthContext.length > 0,
            healthFactorsConsidered: healthContext.length,
          },
        });
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(`⚠️ ${providerName} failed: ${errorMsg}`);

        if (i === PROVIDERS.length - 1) {
          break;
        }

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
