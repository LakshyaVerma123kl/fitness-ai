import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateStreaks } from "@/lib/streaks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch last 30 days for the chart
    const { data: rawRecentData, error: recentError } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("id", { ascending: false }) // Get newest first if duplicates exist
      .limit(60);

    // Deduplicate in memory just in case the DB has duplicates from before
    const recentDataMap = new Map();
    if (rawRecentData) {
      rawRecentData.forEach(entry => {
        if (!recentDataMap.has(entry.date)) {
          recentDataMap.set(entry.date, entry);
        }
      });
    }
    const recentData = Array.from(recentDataMap.values()).reverse().slice(0, 30).reverse();

    if (recentError) {
      console.error("Recent data error:", recentError);
      return NextResponse.json(
        {
          error: "Failed to fetch recent progress",
          details: recentError.message,
        },
        { status: 500 },
      );
    }

    // 2. Fetch ALL completed dates to calculate streaks
    const { data: allCompleted, error: streakError } = await supabase
      .from("daily_progress")
      .select("date")
      .eq("user_id", userId)
      .eq("workout_completed", true)
      .order("date", { ascending: false }); // Newest first

    if (streakError) {
      console.error("Streak data error:", streakError);
      return NextResponse.json(
        { error: "Failed to fetch streak data", details: streakError.message },
        { status: 500 },
      );
    }

    // 3. Calculate streaks using shared utility
    const { currentStreak, longestStreak } = calculateStreaks(allCompleted || []);

    return NextResponse.json({
      entries: recentData || [],
      stats: { currentStreak, longestStreak },
    });
  } catch (error: any) {
    console.error("Error in GET /api/progress:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, weight, mood, workout_completed } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if entry exists for today
    const { data: existing } = await supabase
      .from("daily_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .limit(1);

    let data, error;

    if (existing && existing.length > 0) {
      // Update existing
      const res = await supabase
        .from("daily_progress")
        .update({
          weight: weight || null,
          mood: mood || null,
          workout_completed: workout_completed || false,
        })
        .eq("id", existing[0].id)
        .select();
      data = res.data;
      error = res.error;
    } else {
      // Insert new
      const res = await supabase
        .from("daily_progress")
        .insert({
          user_id: userId,
          date,
          weight: weight || null,
          mood: mood || null,
          workout_completed: workout_completed || false,
        })
        .select();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save progress", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in POST /api/progress:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 },
    );
  }
}
