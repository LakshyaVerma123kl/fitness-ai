import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateBMI } from "@/lib/calculations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: Fetch all plans for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("fitness_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database query failed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 },
    );
  }
}

// POST: Save a new plan
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, userData } = body;

    if (!userData || !plan) {
      return NextResponse.json(
        { error: "Missing plan or userData" },
        { status: 400 },
      );
    }

    // Calculate BMI using shared utility
    const height = parseFloat(userData.height) || 0;
    const weight = parseFloat(userData.weight) || 0;
    const bmi = calculateBMI(weight, height);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("fitness_plans")
      .insert([
        {
          user_id: userId,
          user_data: userData,
          plan_data: plan,
          bmi: bmi,
          provider: plan._metadata?.provider || "AI",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save to database", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error("Error saving plan:", error);
    return NextResponse.json(
      {
        error: "Failed to save plan",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 },
    );
  }
}

// DELETE: Remove a specific plan
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing plan ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Security check: ensure user can only delete their own plans
    const { error } = await supabase
      .from("fitness_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete plan", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      {
        error: "Failed to delete plan",
        details: error.message,
        hint: "Check environment variables and database connection",
      },
      { status: 500 },
    );
  }
}
