import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Health-check endpoint — verifies Supabase connectivity.
 * Used by monitoring / uptime checks.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("fitness_plans").select("id").limit(1);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
