import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are FitnessAI Coach — a friendly, knowledgeable personal trainer and nutritionist.
You help users with questions about their fitness plan, exercises, diet, and health.
Keep answers concise (2-4 sentences) unless a detailed explanation is needed.
If the user mentions pain or injury, recommend seeing a doctor.
Be encouraging and motivational. Use 1-2 relevant emojis maximum.`;

async function callGroq(messages: { role: string; content: string }[]): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function callGemini(messages: { role: string; content: string }[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history,
            { role: "user", parts: [{ text: lastMessage.content }] },
          ],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, planContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // Inject plan context into last user message if provided
    let processedMessages = messages;
    if (planContext) {
      const contextNote = `[User's current plan context: Goal: ${planContext.goal || "unknown"}, Level: ${planContext.level || "unknown"}, Diet: ${planContext.diet || "unknown"}]`;
      processedMessages = messages.map((m: any, i: number) =>
        i === messages.length - 1 && m.role === "user"
          ? { ...m, content: `${contextNote}\n\n${m.content}` }
          : m
      );
    }

    // Try Groq first (fastest), then Gemini
    let reply = await callGroq(processedMessages);
    if (!reply) reply = await callGemini(processedMessages);

    if (!reply) {
      return NextResponse.json(
        { error: "All AI providers failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
