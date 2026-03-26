// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { buildRagContext } from "@/utils/ragContext";
import { generateWithFallback } from "@/utils/llm";

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

    if (!age || !weight || !height) {
      return NextResponse.json(
        { error: "Age, Weight, and Height are required to calculate plans." },
        { status: 400 },
      );
    }

    // --- Local calculations ---
    const heightInMeters = height / 100;
    const bmi = parseFloat(
      (weight / (heightInMeters * heightInMeters)).toFixed(1),
    );

    let bmr: number;
    if (gender === "Male") {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else if (gender === "Female") {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    } else {
      bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 78);
    }

    const activityMultipliers: { [key: string]: number } = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
    };
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));

    // --- Health context ---
    const healthContext: string[] = [];
    if (allergies) healthContext.push(`🚨 ALLERGIES: ${allergies}`);
    if (chronicConditions)
      healthContext.push(`⚕️ CHRONIC CONDITIONS: ${chronicConditions}`);
    if (injuries) healthContext.push(`🩹 INJURIES: ${injuries}`);
    if (medications) healthContext.push(`💊 MEDICATIONS: ${medications}`);
    if (medicalHistory)
      healthContext.push(`📋 MEDICAL NOTES: ${medicalHistory}`);

    const healthInfo =
      healthContext.length > 0
        ? `\n\n⚠️ CRITICAL HEALTH CONSIDERATIONS:\n${healthContext.join(
            "\n",
          )}\n\nYou MUST consider these factors when creating the plan.`
        : "";

    // =========================================
    // 🧠 RAG: Fetch similar highly-rated plans
    // =========================================
    const ragContext = await buildRagContext({
      goal,
      age: Number(age),
      bmi,
      gender: gender || "Other",
      level: level || "Beginner",
      diet: diet || "Standard",
      equipment: equipment || "",
      activityLevel: activityLevel || "Sedentary",
      allergies,
      injuries,
      chronicConditions,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      stressLevel: stressLevel,
    });
    // =========================================
    // 🧠 PROMPT (RAG examples injected at top)
    // =========================================
    const prompt = `You are an elite Personal Trainer, Nutritionist, and Health Professional.
Generate a highly detailed, SAFE, and personalized fitness plan in JSON format only. No markdown, no intro text.
${ragContext}
USER PROFILE:
- Name: ${name || "Athlete"}
- Bio: ${age}yrs, ${gender}, ${weight}kg, ${height}cm (BMI: ${bmi})
- BMR: ${bmr} kcal/day | TDEE: ${tdee} kcal/day
- Goal: ${goal}
- Experience: ${level}
- Diet Preference: ${diet} ${diet === "Desi" || diet.includes("Indian") ? "\n🚨 CRITICAL DIET RULE: User selected Desi/Indian diet. YOU MUST use standard Indian household measures like 'katori' (bowl), 'pieces' (for roti/chapati). Suggest easily accessible Indian home-cooked meals (dal, sabzi, paneer, roti, rice)." : ""}
- Equipment Access: ${equipment} ${equipment.includes("Light Home Workouts") ? "\n🚨 CRITICAL WORKOUT RULE: User requested Light Home Workouts. YOU MUST exclusively recommend extremely gentle, low-impact, joint-friendly exercises that require zero equipment and cause no severe strain. No heavy jumping." : ""}
- Activity Level: ${activityLevel}
- Sleep: ${sleepHours} hours/night
- Water Intake: ${waterIntake}L/day
- Stress Level: ${stressLevel}${healthInfo}

CRITICAL SAFETY REQUIREMENTS:
1. If user has injuries, MODIFY exercises to avoid affected areas
2. If user has chronic conditions, adjust intensity and include monitoring advice
3. If user has allergies, EXCLUDE those foods completely
4. If user takes medications, consider their effects
5. Include specific warnings and modifications

PLAN REQUIREMENTS:
1. SAFETY FIRST: Address all medical concerns explicitly
2. RESULTS TIMELINE: Be honest about when they'll see changes
3. DIET STRATEGY: Week-by-week progression with allergy considerations
4. WORKOUT: 3-5 days with injury modifications if needed
5. MACROS: Calculate based on TDEE and goal
6. HYDRATION & RECOVERY: Specific to their lifestyle

REQUIRED JSON STRUCTURE:
{
  "safety_warnings": ["warning1", "warning2"],
  "motivation_quote": "Short, punchy, personalized quote",
  "results_timeline": {
    "estimated_start": "e.g., 2-4 weeks",
    "milestones": ["Week 2: ...", "Week 4: ...", "Week 8: ...", "Week 12: ..."]
  },
  "health_considerations": {
    "modifications": "Specific modifications",
    "monitoring": "What to track",
    "red_flags": "Warning signs"
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "workout": [
    {
      "day": "Day 1",
      "focus": "Push / Pull / Legs / Cardio / Recovery",
      "duration": "45-60 mins",
      "intensity": "Low/Moderate/High",
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
      "notes": "Specific guidance"
    }
  ],
  "diet": {
    "strategy": {
      "week_1": "Focus on adaptation",
      "week_2": "Optimize macros",
      "week_3_4": "Fine-tune based on progress",
      "allergy_notes": "Foods avoided and alternatives"
    },
    "calorie_target": {
      "daily": "${
        goal === "Weight Loss"
          ? tdee - 500
          : goal === "Muscle Gain"
            ? tdee + 300
            : tdee
      } kcal",
      "explanation": "Why this target"
    },
    "macros": {
      "protein": "Xg",
      "carbs": "Xg",
      "fats": "Xg"
    },
    "meals": {
      "breakfast": {
        "meal": "Name",
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
    "target": "${Math.round(weight * 0.033)}L minimum",
    "timing": "When and how much to drink",
    "signs_of_dehydration": ["Dark urine", "Fatigue", "Dizziness"]
  },
  "recovery": {
    "sleep_target": "7-9 hours (they currently get ${sleepHours})",
    "rest_days": "How many per week and why",
    "stress_management": "Techniques for their stress level",
    "stretching": "Daily routine"
  },
  "supplements": ["Supplement 1 with reason", "Note: Consult doctor"],
  "progress_tracking": {
    "measurements": ["Weight", "Body measurements", "Progress photos"],
    "performance": ["Strength gains", "Endurance improvements"],
    "health_metrics": ["Energy levels", "Sleep quality", "Mood"]
  }
}

Generate a comprehensive, safe, and personalized plan now.`;

    // =========================================
    // 🔄 Provider Fallback Loop
    // =========================================
    try {
      const systemPrompt = "You are an expert fitness coach and nutritionist with medical knowledge. Prioritize safety and health. Return ONLY valid JSON. Do not include markdown formatting.";
      const { text: responseText, providerName } = await generateWithFallback(prompt, systemPrompt);

      // Clean & parse
      let cleanedText = responseText.trim();
      cleanedText = cleanedText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .replace(/`/g, "");

      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1)
        throw new Error("No valid JSON found in AI response");

      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      const parsedData = JSON.parse(cleanedText);

      if (!parsedData.workout || !Array.isArray(parsedData.workout))
        throw new Error("Invalid workout structure");
      if (!parsedData.diet || !parsedData.diet.meals)
        throw new Error("Invalid diet structure");
      if (!parsedData.safety_warnings) {
        parsedData.safety_warnings = [
          "Consult with a healthcare provider before starting any new fitness program.",
        ];
      }

      // ✅ Success — attach metadata including RAG info
      return NextResponse.json({
        ...parsedData,
        _metadata: {
          provider: providerName,
          bmi,
          bmr,
          tdee,
          generatedAt: new Date().toISOString(),
          hasHealthConditions: healthContext.length > 0,
          healthFactorsConsidered: healthContext.length,
          ragEnhanced: ragContext.length > 0,
        },
      });
    } catch (error: any) {
      console.error("❌ Generation failed:", error);
      return NextResponse.json(
        {
          error: "Unable to generate plan. Please try again later.",
          details: error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("❌ Critical Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
