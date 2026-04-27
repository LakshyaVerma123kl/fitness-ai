import { Resend } from "resend";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // Auth check — prevent unauthenticated email triggers
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, type } = await req.json();

    if (!email)
      return NextResponse.json({ error: "No email provided" }, { status: 400 });

    let subject = "Fitness AI Update";
    let html = "";

    if (type === "levelup") {
      subject = "🚀 Level Up Available!";
      html = `
        <h1>Way to go, ${name}!</h1>
        <p>You've crushed your workouts this week.</p>
        <p>Your AI Coach has prepared a <strong>Level Up</strong> plan for you.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Click here to generate your new plan</a></p>
      `;
    }

    const data = await resend.emails.send({
      from: "FitnessAI <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
