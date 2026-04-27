import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ measurements: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { chest, waist, hips, left_arm, right_arm, left_thigh, right_thigh, neck, notes } = body;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("body_measurements")
      .insert({
        user_id: userId,
        chest: chest || null,
        waist: waist || null,
        hips: hips || null,
        left_arm: left_arm || null,
        right_arm: right_arm || null,
        left_thigh: left_thigh || null,
        right_thigh: right_thigh || null,
        neck: neck || null,
        notes: notes || null,
        measured_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, measurement: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
