import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Initialize Supabase Admin Client (Service Role)
// ⚠️ This bypasses RLS policies to allow writing to the database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all plans for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("fitness_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans", details: error.message },
      { status: 500 }
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
        { status: 400 }
      );
    }

    // Calculate BMI based on user data
    // Default to 0 if data is missing to prevent crash
    const height = parseFloat(userData.height) || 0;
    const weight = parseFloat(userData.weight) || 0;
    let bmi = 0;

    if (height > 0) {
      const heightInMeters = height / 100;
      bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    const { data, error } = await supabase
      .from("fitness_plans")
      .insert([
        {
          user_id: userId,
          user_data: userData,
          plan_data: plan,
          bmi: bmi,
          // Use optional chaining in case metadata is missing
          provider: plan._metadata?.provider || "AI",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error("Error saving plan:", error);
    return NextResponse.json(
      { error: "Failed to save plan", details: error.message },
      { status: 500 }
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

    // ⚠️ CRITICAL SECURITY CHECK
    // We must .eq("user_id", userId) to ensure a user
    // cannot delete someone else's plan by guessing an ID.
    const { error } = await supabase
      .from("fitness_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
