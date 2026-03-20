import { NextResponse } from "next/server";
import { generateChatWithFallback } from "@/utils/llm";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are FitnessAI Coach — a friendly, knowledgeable personal trainer and nutritionist.
You help users with questions about their fitness plan, exercises, diet, and health.
Keep answers concise (2-4 sentences) unless a detailed explanation is needed.
If the user mentions pain or injury, recommend seeing a doctor.
Be encouraging and motivational. Use 1-2 relevant emojis maximum.`;

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

    const { text: reply } = await generateChatWithFallback(processedMessages, SYSTEM_PROMPT);

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
