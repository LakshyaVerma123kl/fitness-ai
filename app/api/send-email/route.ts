import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
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
      from: "FitnessAI <onboarding@resend.dev>", // Update this if you have a domain
      to: [email],
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
