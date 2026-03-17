import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables.",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Fixed badge definitions
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

    const supabase = getSupabaseClient();

    // 1. Fetch user's streaks from progress
    const { data: allCompleted, error: streakError } = await supabase
      .from("daily_progress")
      .select("date")
      .eq("user_id", userId)
      .eq("workout_completed", true)
      .order("date", { ascending: false });

    if (streakError) {
      return NextResponse.json({ error: "Failed to fetch streak data" }, { status: 500 });
    }

    let longestStreak = 0;

    if (allCompleted && allCompleted.length > 0) {
      const completedSet = new Set(allCompleted.map((e) => e.date));
      const dates = Array.from(completedSet).sort().reverse();
      let tempStreak = 0;

      for (let i = 0; i < dates.length; i++) {
        const current = new Date(dates[i]);
        const next = i < dates.length - 1 ? new Date(dates[i + 1]) : null;

        tempStreak++;

        if (next) {
          const diffTime = Math.abs(current.getTime() - next.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }
    }

    // Determine unlocked badges based on the calculated longest streak
    const earnedBadges = BADGE_DEFINITIONS.filter(b => longestStreak >= b.days).map(b => b.id);

    return NextResponse.json({
      earnedBadges,
      longestStreak
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
