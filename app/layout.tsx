import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitnessAI - Your AI Personal Trainer",
  description: "AI-powered personalized fitness and diet plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
