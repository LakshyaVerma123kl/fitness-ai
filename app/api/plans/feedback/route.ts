// app/api/plans/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase env vars. URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`,
    );
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────
    const { userId } = await auth();

    if (!userId) {
      console.error("[feedback] No userId — Clerk auth failed");
      return NextResponse.json(
        { error: "Unauthorized", hint: "Clerk session missing or expired" },
        { status: 401 },
      );
    }

    // ── 2. Validate body ───────────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { planId, rating, feedbackNote } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 },
      );
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // ── 3. Check plan exists + belongs to user ─────────────────────
    const supabase = getSupabaseClient();

    const { data: existingPlan, error: fetchError } = await supabase
      .from("fitness_plans")
      .select("id, user_id")
      .eq("id", planId)
      .single();

    if (fetchError) {
      console.error("[feedback] Plan fetch error:", fetchError);
      // Most common cause: column 'rating' doesn't exist yet (migration not run)
      if (
        fetchError.message?.includes("column") ||
        fetchError.code === "42703"
      ) {
        return NextResponse.json(
          {
            error: "Database schema outdated",
            hint: "Run the RAG migration SQL in Supabase to add the rating and feedback_note columns",
            details: fetchError.message,
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "Plan not found", details: fetchError.message },
        { status: 404 },
      );
    }

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existingPlan.user_id !== userId) {
      console.warn(
        `[feedback] Ownership mismatch: ${userId} vs ${existingPlan.user_id}`,
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 4. Update ──────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("fitness_plans")
      .update({
        rating: rating,
        feedback_note: feedbackNote?.trim() || null,
      })
      .eq("id", planId)
      .eq("user_id", userId); // double-check ownership at DB level too

    if (updateError) {
      console.error("[feedback] Update error:", updateError);

      // Specific hint for missing column (migration not applied)
      if (
        updateError.message?.includes("column") ||
        updateError.code === "42703"
      ) {
        return NextResponse.json(
          {
            error: "Migration not applied",
            hint: "Open Supabase → SQL Editor and run the RAG migration script. The 'rating' and 'feedback_note' columns are missing.",
            details: updateError.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "Failed to save feedback", details: updateError.message },
        { status: 500 },
      );
    }

    console.log(`[feedback] ✅ Plan ${planId} rated ${rating}/5 by ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[feedback] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
