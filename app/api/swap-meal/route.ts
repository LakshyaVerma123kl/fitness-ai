import { NextResponse } from "next/server";

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

    async function tryGroq(): Promise<any | null> {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return null;
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.8,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      } catch { return null; }
    }

    async function tryGemini(): Promise<any | null> {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return null;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
            }),
          }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      } catch { return null; }
    }

    let swapped = await tryGroq();
    if (!swapped?.meal) swapped = await tryGemini();
    if (!swapped?.meal) return NextResponse.json({ error: "Failed to generate swap" }, { status: 502 });

    return NextResponse.json({ swapped });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
