// utils/ragContext.ts  — v2: full-dimension RAG matching
// Fetches top-rated similar plans from Supabase across ALL user dimensions
// and formats them as rich few-shot examples for the AI prompt.

import { createClient } from "@supabase/supabase-js";

interface RagPlan {
  plan_data: any;
  user_data: any;
  rating: number;
  feedback_note: string | null;
  match_tier: number;
}

// ── Bucketing helpers ──────────────────────────────────────────────────────

function getAgeRange(age: number): string {
  if (age <= 17) return "13-17";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return "55+";
}

function getBmiRange(bmi: number): string {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function normaliseEquipment(equipment: string): string {
  const eq = equipment.toLowerCase();
  if (eq.includes("gym") || eq.includes("barbell") || eq.includes("machine"))
    return "Gym";
  if (eq.includes("home") || eq.includes("dumbbell") || eq.includes("band"))
    return "Home";
  return "No Equipment";
}

// ── Params ─────────────────────────────────────────────────────────────────

export interface RagParams {
  goal: string;
  age: number;
  bmi: number;
  gender: string;
  level: string;
  diet: string; // e.g. "Vegetarian", "Vegan", "Keto", "Standard"
  equipment: string;
  activityLevel: string;
  allergies?: string;
  injuries?: string;
  chronicConditions?: string;
  sleepHours?: number;
  stressLevel?: string;
}

// ── Main export ────────────────────────────────────────────────────────────

export async function buildRagContext(params: RagParams): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return "";

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ageRange = getAgeRange(params.age);
    const bmiRange = getBmiRange(params.bmi);
    const equipmentType = normaliseEquipment(params.equipment || "");
    const hasInjuries = Boolean(params.injuries?.trim());
    const hasConditions = Boolean(params.chronicConditions?.trim());

    const { data, error } = await supabase.rpc("get_similar_plans", {
      p_goal: params.goal,
      p_diet_type: params.diet,
      p_age_range: ageRange,
      p_bmi_range: bmiRange,
      p_level: params.level,
      p_activity_level: params.activityLevel,
      p_equipment_type: equipmentType,
      p_gender: params.gender,
      p_has_injuries: hasInjuries,
      p_has_conditions: hasConditions,
      p_limit: 3,
    });

    if (error || !data || data.length === 0) return "";

    const plans = data as RagPlan[];

    // ── Format each example into a rich but token-efficient block ──
    const examples = plans
      .map((p, i) => {
        const pd = p.plan_data;
        const ud = p.user_data;

        // Workout: day + focus + top 2 exercise names per day
        const workoutSummary = Array.isArray(pd.workout)
          ? pd.workout
              .map((d: any) => {
                const topExercises = (d.exercises || [])
                  .slice(0, 2)
                  .map((e: any) => e.name)
                  .join(", ");
                return `${d.day} (${d.focus})${topExercises ? ": " + topExercises : ""}`;
              })
              .join(" | ")
          : "N/A";

        // Diet: meal name + calories for each slot
        const meals = pd.diet?.meals || pd.diet || {};
        const mealSummary = Object.entries(meals)
          .map(([slot, m]: [string, any]) =>
            m?.meal
              ? `${slot.replace(/_/g, " ")}: ${m.meal}${m.calories ? " (${m.calories})" : ""}`
              : null,
          )
          .filter(Boolean)
          .join(" | ");

        // Macros
        const macros = pd.diet?.macros
          ? `P:${pd.diet.macros.protein} C:${pd.diet.macros.carbs} F:${pd.diet.macros.fats}`
          : "N/A";

        // Match quality label
        const tierLabel =
          [
            "",
            "Exact match",
            "Close match",
            "Similar BMI+diet",
            "Same diet",
            "Same goal",
          ][p.match_tier] || "Similar";

        // Optional feedback
        const feedbackLine = p.feedback_note
          ? `\n  ✅ User feedback: "${p.feedback_note}"`
          : "";

        return `
── Example ${i + 1} ── (${tierLabel}, ${p.rating}⭐/5)
  Profile : ${ud.age}y ${ud.gender}, ${ud.weight}kg, BMI ~${params.bmi.toFixed(1)}, ${ud.level}, ${ud.activityLevel || ""}
  Diet    : ${ud.diet || "Standard"}${ud.allergies ? " | Allergies: " + ud.allergies : ""}
  Goal    : ${ud.goal}
  Calories: ${pd.diet?.calorie_target?.daily || "N/A"} kcal/day | Macros: ${macros}
  Workout : ${workoutSummary}
  Meals   : ${mealSummary}${feedbackLine}`;
      })
      .join("\n");

    // Describe how well the match is for the AI's awareness
    const bestTier = Math.min(...plans.map((p) => p.match_tier));
    const matchQuality =
      bestTier <= 2
        ? "highly similar"
        : bestTier <= 4
          ? "moderately similar"
          : "same-goal";

    return `
╔═══════════════════════════════════════════════════════════════╗
║  RAG CONTEXT — ${plans.length} ${matchQuality.toUpperCase()} HIGHLY-RATED PLANS (inspiration only)  ║
╚═══════════════════════════════════════════════════════════════╝
${examples}

INSTRUCTIONS FOR AI:
- These are REAL plans that similar users rated highly.
- Use them as structural and nutritional inspiration — DO NOT copy verbatim.
- The current user has different exact stats; recalculate all numbers for them.
- If user's diet (${params.diet}) differs from an example, adapt meals accordingly.
- If user has injuries/conditions the examples don't have, add safe modifications.
- Prioritise the highest-rated / closest-matched examples above.
═══════════════════════════════════════════════════════════════
`;
  } catch (err) {
    console.warn("RAG context fetch failed (non-fatal):", err);
    return "";
  }
}
