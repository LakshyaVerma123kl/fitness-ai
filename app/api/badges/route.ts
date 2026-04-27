import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateStreaks } from "@/lib/streaks";

export const dynamic = "force-dynamic";

// Badge definitions — unlocked based on longest streak
const BADGE_DEFINITIONS = [
  { id: "streak_3", label: "3 Day Streak", days: 3, icon: "Medal", color: "text-orange-400" },
  { id: "streak_7", label: "7 Day Streak", days: 7, icon: "Trophy", color: "text-gray-300" },
  { id: "streak_14", label: "14 Day Streak", days: 14, icon: "Award", color: "text-yellow-400" },
  { id: "streak_30", label: "Legend", days: 30, icon: "Star", color: "text-purple-400" },
];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: allCompleted, error: streakError } = await supabase
      .from("daily_progress")
      .select("date")
      .eq("user_id", userId)
      .eq("workout_completed", true)
      .order("date", { ascending: false });

    if (streakError) {
      return NextResponse.json({ error: "Failed to fetch streak data" }, { status: 500 });
    }

    // Use shared streak calculation
    const { longestStreak } = calculateStreaks(allCompleted || []);
    const earnedBadges = BADGE_DEFINITIONS
      .filter((b) => longestStreak >= b.days)
      .map((b) => b.id);

    return NextResponse.json({ earnedBadges, longestStreak });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}

