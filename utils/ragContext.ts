// utils/ragContext.ts
// Fetches top-rated similar plans from Supabase and formats them
// as few-shot examples to inject into the AI prompt.

import { createClient } from "@supabase/supabase-js";

interface RagPlan {
  plan_data: any;
  user_data: any;
  rating: number;
  feedback_note: string | null;
}

function getBmiRange(bmi: number): string {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function getAgeRange(age: number): string {
  if (age <= 17) return "13-17";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return "55+";
}

export async function buildRagContext(params: {
  goal: string;
  age: number;
  bmi: number;
}): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Gracefully skip RAG if env vars missing (e.g., local dev without DB)
  if (!supabaseUrl || !supabaseKey) return "";

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ageRange = getAgeRange(params.age);
    const bmiRange = getBmiRange(params.bmi);

    // Call the Supabase RPC we defined in the migration
    const { data, error } = await supabase.rpc("get_similar_plans", {
      p_goal: params.goal,
      p_age_range: ageRange,
      p_bmi_range: bmiRange,
      p_limit: 3,
    });

    if (error || !data || data.length === 0) return "";

    const plans = data as RagPlan[];

    // Build a concise few-shot context block
    const examples = plans
      .map((p, i) => {
        const pd = p.plan_data;
        const ud = p.user_data;

        // Summarise workout (day names + focus only, keeps tokens low)
        const workoutSummary = Array.isArray(pd.workout)
          ? pd.workout.map((d: any) => `${d.day}: ${d.focus}`).join(", ")
          : "N/A";

        // Summarise meals (meal names only)
        const meals = pd.diet?.meals || pd.diet || {};
        const mealSummary = Object.values(meals)
          .map((m: any) => m.meal)
          .filter(Boolean)
          .join(", ");

        // Include user feedback note if available
        const feedbackLine = p.feedback_note
          ? `\n  User feedback: "${p.feedback_note}"`
          : "";

        return `
Example ${i + 1} (rated ${p.rating}/5 by a similar user):
  Profile: Age ${ud.age}, ${ud.gender}, ${ud.weight}kg, Goal: ${ud.goal}, Level: ${ud.level}
  Workout structure: ${workoutSummary}
  Meals: ${mealSummary}
  Calorie target: ${pd.diet?.calorie_target?.daily || "N/A"}
  Motivation quote: "${pd.motivation_quote || ""}"${feedbackLine}`;
      })
      .join("\n");

    return `
=== HIGHLY-RATED PLANS FROM SIMILAR USERS (use as inspiration) ===
${examples}
=== END OF EXAMPLES ===

Use the patterns above as reference for structure, intensity, and meal variety.
Adapt them to this user's specific profile — do NOT copy verbatim.
`;
  } catch (err) {
    // Never crash generation because of RAG failure
    console.warn("RAG context fetch failed (non-fatal):", err);
    return "";
  }
}
