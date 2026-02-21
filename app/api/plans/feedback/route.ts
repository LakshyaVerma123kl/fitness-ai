// app/api/plans/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey)
    throw new Error("Missing Supabase environment variables");
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// POST /api/plans/feedback  { planId, rating, feedbackNote }
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { planId, rating, feedbackNote } = body;

    if (!planId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "planId and rating (1-5) are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();

    // Security: only the owner can rate their own plan
    const { error } = await supabase
      .from("fitness_plans")
      .update({
        rating,
        feedback_note: feedbackNote || null,
      })
      .eq("id", planId)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase feedback error:", error);
      return NextResponse.json(
        { error: "Failed to save feedback", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Feedback route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
