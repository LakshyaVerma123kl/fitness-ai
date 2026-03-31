import { NextResponse } from "next/server";
import { generateWithFallback } from "@/utils/llm";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const cleanQuery = text.trim().toLowerCase();

    // 1. CHECK CACHE FIRST (for the exact full string)
    try {
      const { data: cachedFood } = await supabase
        .from("food_cache")
        .select("*")
        .eq("food_query", cleanQuery)
        .single();
        
      if (cachedFood) {
        console.log(`[parse-meal] ⚡️ Cache Hit for "${cleanQuery}"`);
        return NextResponse.json({
          calories: Number(cachedFood.calories),
          protein: Number(cachedFood.protein),
          carbs: Number(cachedFood.carbs),
          fats: Number(cachedFood.fats),
        });
      }
    } catch (e) {
      console.warn("[parse-meal] Cache read error:", e);
    }

    // 2. GENERATE AND BREAK DOWN NEW MEAL
    console.log(`[parse-meal] 🤖 Cache Miss for "${cleanQuery}". Generating...`);

    const prompt = `You are an expert nutritionist. The user is telling you what they ate. You need to estimate the macros and calories for the given text. Pay special attention to Indian household measures like "katori" (bowl, ~150-200ml), "roti" (flatbread), etc.
    
User's meal: "${text}"

Provide a realistic estimate. If the user provided multiple items (e.g. "2 roti and 1 dal"), break them down into an "items" array so we can cache them individually. Also provide the "total" sum.
If the user provided just one item, put it as a single element in the "items" array.

RETURN ONLY PURE JSON with the following structure exactly, no markdown formatting, no explanations:
{
  "items": [
    {
      "name": "formatted item name e.g. '1 katori dal'",
      "calories": 150,
      "protein": 8,
      "carbs": 20,
      "fats": 4
    }
  ],
  "total": {
    "calories": 450,
    "protein": 15,
    "carbs": 55,
    "fats": 12
  }
}`;

    const systemPrompt = "You are a specialized macro calculator API. Return ONLY raw JSON matching the requested structure.";
    
    const { text: responseText } = await generateWithFallback(prompt, systemPrompt);

    // Clean padding
    let cleaned = responseText.trim().replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    const data = JSON.parse(cleaned);
    
    // 3. SAVE INDIVIDUAL ITEMS TO CACHE
    if (data.items && Array.isArray(data.items)) {
      const inserts = data.items.map((item: any) => ({
        food_query: item.name.toLowerCase().trim(),
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fats: Number(item.fats) || 0,
      }));

      // Insert full query as well to catch exact phrases next time
      if (inserts.length >= 1 && cleanQuery !== inserts[0].food_query) {
         inserts.push({
            food_query: cleanQuery,
            calories: Number(data.total?.calories) || 0,
            protein: Number(data.total?.protein) || 0,
            carbs: Number(data.total?.carbs) || 0,
            fats: Number(data.total?.fats) || 0,
         });
      }

      try {
        await supabase.from("food_cache").upsert(inserts, { onConflict: "food_query", ignoreDuplicates: true });
        console.log(`[parse-meal] 💾 Saved ${inserts.length} items to cache`);
      } catch (err) {
        console.warn("[parse-meal] Cache write error:", err);
      }
    }

    // Ensure all numeric values
    return NextResponse.json({
      calories: Number(data.total?.calories) || 0,
      protein: Number(data.total?.protein) || 0,
      carbs: Number(data.total?.carbs) || 0,
      fats: Number(data.total?.fats) || 0,
    });
  } catch (error: any) {
    console.error("Meal parsing error:", error);
    return NextResponse.json({ error: "Failed to parse meal" }, { status: 500 });
  }
}
