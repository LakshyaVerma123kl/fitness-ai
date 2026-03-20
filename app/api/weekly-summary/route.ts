import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { generateWithFallback } from "@/utils/llm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userName, userGoal } = body;

    const supabase = getSupabaseClient();

    // Get last 7 days of progress
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: progressData } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", userId)
      .gte("date", sevenDaysAgo)
      .order("date", { ascending: true });

    // Get last 7 days of workout logs
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("logged_at", { ascending: false });

    const workoutsCompleted = progressData?.filter((e) => e.workout_completed).length || 0;
    const weights = progressData?.filter((e) => e.weight).map((e) => e.weight) || [];
    const weightChange = weights.length >= 2 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null;
    const exercisesDone = [...new Set(workoutLogs?.map((l) => l.exercise_name) || [])];

    const prompt = `You are an encouraging, data-driven AI fitness coach giving a weekly progress summary.
    
User: ${userName || "Athlete"}
Goal: ${userGoal || "Get Fit"}
Week Stats:
- Workouts Completed: ${workoutsCompleted}/7 days
- Weight Change: ${weightChange !== null ? `${weightChange}kg` : "Not tracked"}
- Exercises Logged: ${exercisesDone.join(", ") || "None"}
- Moods recorded: ${progressData?.map((e) => e.mood).filter(Boolean).join(", ") || "None"}

Write a SHORT, punchy 3-sentence weekly summary. Be specific with their numbers. Include:
1. A celebration of wins (even small ones)
2. One specific insight from their data
3. One motivational push for next week

Keep it under 80 words. Sound human, not robotic. Use 1-2 emojis naturally.`;

    const { text: summaryText } = await generateWithFallback(prompt);

    return NextResponse.json({
      summary: summaryText,
      stats: {
        workoutsCompleted,
        totalDays: progressData?.length || 0,
        weightChange,
        exercisesLogged: exercisesDone.length,
      },
    });
  } catch (error: any) {
    console.error("Weekly summary error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
