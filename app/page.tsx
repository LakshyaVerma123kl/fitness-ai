"use client";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import FitnessForm from "@/components/FitnessForm";
import PlanDisplay from "@/components/PlanDisplay";

export default function Home() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Load dark mode preference
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    }
  }, []);

  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    setError("");
    setUserData(formData);

    console.log("📤 Sending form data:", formData);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const data = await res.json();
      console.log("✅ Received plan data:", data);

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

  const handleRegenerate = () => {
    if (userData) {
      setPlan(null);
      setTimeout(() => handleGenerate(userData), 100);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden transition-colors duration-300">
      {/* Background Gradient Blobs - Responsive sizes */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-primary/20 rounded-full blur-[80px] sm:blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] bg-[#6366f1]/20 rounded-full blur-[80px] sm:blur-[100px]" />

      {/* Dark Mode Toggle - Responsive positioning */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 sm:p-3 glass-card rounded-full hover:scale-110 transition-transform shadow-lg"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="text-primary" size={20} />
        ) : (
          <Moon className="text-accent" size={20} />
        )}
      </button>

      <div className="z-10 w-full max-w-5xl">
        {/* Header - Responsive text sizes */}
        <header className="mb-8 sm:mb-10 md:mb-12 text-center px-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 tracking-tighter leading-tight">
            FITNESS<span className="text-primary">AI</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Your AI-Powered Personal Trainer
          </p>
        </header>

        {/* Error Message - Responsive */}
        {error && (
          <div className="mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center max-w-md mx-auto text-sm sm:text-base">
            ⚠️ {error}
          </div>
        )}

        {!plan ? (
          <FitnessForm onSubmit={handleGenerate} isLoading={loading} />
        ) : (
          <PlanDisplay
            plan={plan}
            reset={() => {
              setPlan(null);
              setUserData(null);
            }}
            onRegenerate={handleRegenerate}
            userData={userData}
          />
        )}
      </div>
    </main>
  );
}
