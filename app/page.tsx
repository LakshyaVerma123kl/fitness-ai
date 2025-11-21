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
  const [userData, setUserData] = useState<any>(null); // Changed to any for flexibility
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    setError("");
    setUserData(formData); // Store user data so we can save it later

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const data = await res.json();
      if (!data.workout || !data.diet) {
        throw new Error("Invalid plan structure received");
      }

      setPlan(data);
    } catch (error: any) {
      console.error("❌ Error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Modified Regenerate function to handle adaptive updates
  const handleRegenerate = (adaptive: boolean = false) => {
    if (!userData) return;

    setPlan(null); // Clear current plan to show loading state

    // If adaptive update is requested (user made progress),
    // we simulate a 'level up' by modifying the input data
    let nextUserData = { ...userData };

    if (adaptive) {
      // Logic to "level up" the user request
      if (userData.level === "Beginner") nextUserData.level = "Intermediate";
      else if (userData.level === "Intermediate")
        nextUserData.level = "Advanced";

      // You could also add a note to the prompt implicitly
      // The API endpoint could handle a new field "adaptive_mode": true
    }

    // Update local state with new 'level' if changed
    setUserData(nextUserData);

    // Call generation with the (potentially updated) data
    setTimeout(() => handleGenerate(nextUserData), 100);
  };

  // Prevent hydration mismatch by not rendering theme toggles until mounted
  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center relative bg-[var(--color-dark)] text-[var(--color-text)] transition-colors duration-300">
      {/* Navbar */}
      {/* Navbar */}
      <nav className="w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter">
            FITNESS<span className="text-[#00e599]">AI</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-white/10 rounded-full transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="text-[#00e599]" size={18} />
            ) : (
              <Moon className="text-gray-600" size={18} />
            )}
          </button>

          {/* Auth Buttons */}
          <SignedOut>
            <Link href="/sign-in">
              <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:text-[#00e599] transition">
                Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-3 sm:px-4 py-2 bg-[#00e599] text-black text-xs sm:text-sm font-bold rounded-lg hover:bg-[#00cc88] transition shadow-lg shadow-green-500/20">
                Get Started
              </button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <button className="px-2 sm:px-4 py-2 bg-white/10 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/20 sm:mr-4 flex items-center gap-1 sm:gap-2 transition">
                <LayoutDashboard size={16} className="sm:inline" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border-2 border-[#00e599]",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>

      {/* Content Area */}
      <div className="z-10 w-full max-w-5xl px-4 py-10">
        {!plan && (
          <header className="mb-12 text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">
              YOUR AI{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e599] to-blue-500">
                TRAINER
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Generate personalized workout & diet plans in seconds.
            </p>
          </header>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            ⚠️ {error}
          </div>
        )}

        {!plan ? (
          <div className="w-full max-w-2xl mx-auto">
            <FitnessForm onSubmit={handleGenerate} isLoading={loading} />
          </div>
        ) : (
          <PlanDisplay
            plan={plan}
            reset={() => {
              setPlan(null);
              setUserData(null);
            }}
            onRegenerate={handleRegenerate} // Pass the new function
            userData={userData}
          />
        )}
      </div>
    </main>
  );
}
