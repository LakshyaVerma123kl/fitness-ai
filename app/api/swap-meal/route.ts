import { NextResponse } from "next/server";
import { generateWithFallback } from "@/utils/llm";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { meal, macros, dietType, allergies } = await req.json();
    if (!meal) return NextResponse.json({ error: "Meal required" }, { status: 400 });

    const prompt = `You are a nutritionist. Suggest an alternative meal to replace: "${meal}".
Requirements:
- Similar macros: ~${macros?.protein || "?"}g protein, ~${macros?.carbs || "?"}g carbs, ~${macros?.fats || "?"}g fats, ~${macros?.calories || "?"}kcal
- Diet type: ${dietType || "any"}
- Avoid: ${allergies || "nothing specific"}

Reply with ONLY a JSON object (no markdown, no explanation):
{
  "meal": "name of the new meal",
  "protein": "Xg",
  "carbs": "Xg",
  "fats": "Xg",
  "calories": "Xkcal",
  "portion": "serving description",
  "prep_time": "X min"
}`;

    let swapped = null;
    try {
      const { text } = await generateWithFallback(prompt);
      swapped = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (!swapped?.meal) throw new Error("Invalid output");
    } catch (error) {
      return NextResponse.json({ error: "Failed to generate swap" }, { status: 502 });
    }

    return NextResponse.json({ swapped });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
