import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const exercise = url.searchParams.get("exercise");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(100);

    if (exercise) query = query.eq("exercise_name", exercise);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ logs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { exercise_name, sets, reps, weight_kg, duration_seconds, notes, pose_score } = body;

    if (!exercise_name) {
      return NextResponse.json({ error: "exercise_name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Prevent duplicate logs for the same exercise on the same day (due to rapid UI clicking)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("exercise_name", exercise_name)
      .gte("logged_at", todayStart.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      // Already logged today, just return success
      return NextResponse.json({ success: true, log: existing[0], note: "Already logged today" });
    }

    const { data, error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: userId,
        exercise_name,
        sets: sets || null,
        reps: reps || null,
        weight_kg: weight_kg || null,
        duration_seconds: duration_seconds || null,
        notes: notes || null,
        pose_score: pose_score || null,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
