import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Initialize Supabase Admin Client (Service Role)
// ⚠️ This bypasses RLS policies to allow writing to the database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fixed: Using 'user_id' to match the insert operation
    const { data, error } = await supabase
      .from("fitness_plans")
      .select("*")
      .eq("user_id", userId) // Changed from 'clerk_id' to 'user_id'
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

    // Calculate BMI
    const heightInMeters = userData.height / 100;
    const bmi = (userData.weight / (heightInMeters * heightInMeters)).toFixed(
      1
    );

    const { data, error } = await supabase
      .from("fitness_plans")
      .insert([
        {
          user_id: userId, // This matches the column in your database
          user_data: userData,
          plan_data: plan,
          bmi: parseFloat(bmi),
          provider: plan._provider || "AI",
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
