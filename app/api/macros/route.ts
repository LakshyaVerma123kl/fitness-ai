/**
 * GET/POST /api/macros — Daily Macro Logger
 *
 * GET:  Fetches the user's macro log for a specific date (defaults to today).
 * POST: Upserts a daily macro entry (calories, protein, carbs, fats)
 *       using Supabase's on-conflict strategy so only one row per date exists.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from("daily_macros")
      .select("*")
      .eq("user_id", userId);
      
    if (date) {
        query = query.eq("date", date);
    } else {
        query = query.order("date", { ascending: false }).limit(30);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch macro data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
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
    const { date, calories, protein, carbs, fats } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("daily_macros")
      .upsert(
        {
          user_id: userId,
          date,
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fats: fats || 0
        },
        { onConflict: "user_id, date" }
      )
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save macro data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
