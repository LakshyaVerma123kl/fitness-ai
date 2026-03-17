"use client";
import dynamic from "next/dynamic";

const AIChatCoach = dynamic(() => import("./AIChatCoach"), { ssr: false });

export default function GlobalChatWidget() {
  return <AIChatCoach />;
}
