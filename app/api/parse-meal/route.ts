import { NextResponse } from "next/server";
import { generateWithFallback } from "@/utils/llm";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const prompt = `You are an expert nutritionist. The user is telling you what they ate. You need to estimate the macros and calories for the given text. Pay special attention to Indian household measures like "katori" (bowl, ~150-200ml), "roti" (flatbread), etc.
    
User's meal: "${text}"

Provide a realistic estimate. 
RETURN ONLY PURE JSON with the following structure exactly, no markdown formatting, no explanations:
{
  "calories": 450,
  "protein": 15,
  "carbs": 55,
  "fats": 12
}`;

    const systemPrompt = "You are a specialized macro calculator API. Return ONLY raw JSON matching the requested structure.";
    
    const { text: responseText } = await generateWithFallback(prompt, systemPrompt);

    // Clean padding
    let cleaned = responseText.trim().replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    const data = JSON.parse(cleaned);
    
    // Ensure all numeric values
    return NextResponse.json({
      calories: Number(data.calories) || 0,
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fats: Number(data.fats) || 0,
    });
  } catch (error: any) {
    console.error("Meal parsing error:", error);
    return NextResponse.json({ error: "Failed to parse meal" }, { status: 500 });
  }
}
