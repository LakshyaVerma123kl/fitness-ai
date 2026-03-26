import { NextResponse } from "next/server";
import { generateWithFallback } from "@/utils/llm";

export async function POST(req: Request) {
  try {
    const { dietPlan } = await req.json();

    const prompt = `You are an elite Indian Nutritionist. You have received the following daily diet plan:
${JSON.stringify(dietPlan)}

YOUR GOAL: Translate EVERY single meal to an authentic Indian (Desi) alternative.
CRITICAL RULES:
- Keep the EXACT same macro nutritional targets (Protein, Carbs, Fats, Calories).
- Use accessible Indian household foods (Dal, Paneer, Chicken Tikka, Roti, Rice, Poha, etc.).
- Use Indian household measurements in the 'portion' field (e.g., '1 katori', '2 pieces').
- Provide step by step prep instruction as usual.
- Reply ONLY with a valid JSON object matching the exact structure of the original 'diet' object provided above. Do not wrap in markdown or add explanations.`;

    const systemPrompt = "Return ONLY valid JSON representing the new diet structure. Ensure all meals are converted to Indian cuisine.";
    const { text } = await generateWithFallback(prompt, systemPrompt);

    let cleanedText = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "");
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);

    const newDiet = JSON.parse(cleanedText);

    return NextResponse.json({ diet: newDiet });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to desify diet", details: error.message }, { status: 500 });
  }
}
