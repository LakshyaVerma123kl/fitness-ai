import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Validate environment variables
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch last 30 days for the chart
    const { data: recentData, error: recentError } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(30);

    if (recentError) {
      console.error("Recent data error:", recentError);
      return NextResponse.json(
        {
          error: "Failed to fetch recent progress",
          details: recentError.message,
        },
        { status: 500 }
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
        { status: 500 }
      );
    }

    // 3. Calculate Streaks
    let currentStreak = 0;
    let longestStreak = 0;

    if (allCompleted && allCompleted.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Set unique dates set for O(1) lookup
      const completedSet = new Set(allCompleted.map((e) => e.date));
      const dates = Array.from(completedSet).sort().reverse(); // Descending YYYY-MM-DD

      // --- Calculate Current Streak ---
      // Streak is alive if we did it Today OR Yesterday
      if (completedSet.has(today) || completedSet.has(yesterday)) {
        let dateCheck = new Date();
        // If not done today, start checking from yesterday
        if (!completedSet.has(today)) {
          dateCheck.setDate(dateCheck.getDate() - 1);
        }

        while (true) {
          const dateStr = dateCheck.toISOString().split("T")[0];
          if (completedSet.has(dateStr)) {
            currentStreak++;
            dateCheck.setDate(dateCheck.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // --- Calculate Longest Streak ---
      let tempStreak = 0;
      for (let i = 0; i < dates.length; i++) {
        const current = new Date(dates[i]);
        const next = i < dates.length - 1 ? new Date(dates[i + 1]) : null;

        tempStreak++;

        if (next) {
          const diffTime = Math.abs(current.getTime() - next.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 1) {
            // Gap found, reset
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
        } else {
          // End of list
          longestStreak = Math.max(longestStreak, tempStreak);
        }
      }
    }

    return NextResponse.json({
      entries: recentData || [],
      stats: {
        currentStreak,
        longestStreak,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/progress:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 }
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

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("daily_progress")
      .upsert(
        {
          user_id: userId,
          date,
          weight: weight || null,
          mood: mood || null,
          workout_completed: workout_completed || false,
        },
        { onConflict: "user_id, date" }
      )
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save progress", details: error.message },
        { status: 500 }
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
      { status: 500 }
    );
  }
}
