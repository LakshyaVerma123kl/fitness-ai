"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, LayoutDashboard } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import FitnessForm from "@/components/FitnessForm";
import PlanDisplay from "@/components/PlanDisplay";

export default function Home() {
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    setError("");
    setUserData(formData);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center relative bg-(--color-dark) text-(--color-text) transition-colors">
      {/* Navbar */}
      <nav className="w-full max-w-6xl px-6 py-6 flex justify-between items-center z-50">
        <h1 className="text-2xl font-black tracking-tighter text--color-text">
          FITNESS<span className="text-[#00e599]">AI</span>
        </h1>
        <div className="flex items-center gap-4">
          {/* Theme Toggle - Only render after mount to prevent hydration error */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/5 rounded-full transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="text-[#00e599]" size={20} />
              ) : (
                <Moon className="text-[#00e599]" size={20} />
              )}
            </button>
          )}

          {/* If not mounted yet, show a placeholder to prevent layout shift */}
          {!mounted && <div className="w-9 h-9" />}

          <SignedOut>
            <Link href="/sign-in">
              <button className="px-4 py-2 text-sm font-medium hover:text-[#00e599] transition">
                Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-4 py-2 bg-[#00e599] text-black text-sm font-bold rounded-lg hover:bg-[#00cc88] transition">
                Get Started
              </button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-white/10 dark:bg-white/10 bg-black/5 rounded-lg text-sm font-medium hover:bg-white/20 dark:hover:bg-white/20 hover:bg-black/10 mr-4 flex items-center gap-2 transition">
                <LayoutDashboard size={16} /> Dashboard
              </button>
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-9 h-9 border-2 border-[#00e599]" },
              }}
            />
          </SignedIn>
        </div>
      </nav>

      {/* Content */}
      <div className="z-10 w-full max-w-5xl px-4 py-10">
        {!plan && (
          <header className="mb-12 text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-(--color-text)">
              YOUR AI{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00e599] to-blue-500">
                TRAINER
              </span>
            </h1>
            <p className="text-lg text-(--color-text-secondary)">
              Generate personalized workout & diet plans in seconds.
            </p>
          </header>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {!plan ? (
          <FitnessForm onSubmit={handleGenerate} isLoading={loading} />
        ) : (
          <PlanDisplay
            plan={plan}
            reset={() => setPlan(null)}
            userData={userData}
            onRegenerate={() => handleGenerate(userData)}
          />
        )}
      </div>
    </main>
  );
}
