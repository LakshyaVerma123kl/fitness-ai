"use client";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Dumbbell,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  ArrowLeft,
  Moon,
  Sun,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import PlanDisplay from "@/components/PlanDisplay";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPlans();
    }
  }, [isLoaded, user]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (Array.isArray(data)) setPlans(data);
    } catch (err) {
      console.error("Failed to load plans", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark)] transition-colors">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );

  // If a plan is selected, show the full plan view
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] transition-colors">
        {/* Navbar */}
        <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)] cursor-pointer hover:opacity-80 transition">
              FITNESS<span className="text-primary">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="text-primary" size={20} />
                ) : (
                  <Moon className="text-primary" size={20} />
                )}
              </button>
            )}
            {!mounted && <div className="w-9 h-9" />}

            <button
              onClick={() => setSelectedPlan(null)}
              className="px-3 sm:px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-xs sm:text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20 flex items-center gap-1 sm:gap-2 transition text-[var(--color-text)]"
            >
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border-2 border-primary",
                },
              }}
            />
          </div>
        </nav>

        {/* Display the full plan */}
        <PlanDisplay
          plan={selectedPlan.plan_data}
          userData={selectedPlan.user_data}
          reset={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] p-4 sm:p-6 md:p-12 transition-colors">
      {/* Header with Navbar */}
      <div className="max-w-6xl mx-auto">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-8 sm:mb-12">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)] cursor-pointer hover:opacity-80 transition">
              FITNESS<span className="text-primary">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="text-primary" size={20} />
                ) : (
                  <Moon className="text-primary" size={20} />
                )}
              </button>
            )}
            {!mounted && <div className="w-9 h-9" />}

            <Link href="/">
              <button
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                title="Home"
              >
                <Home size={20} className="text-primary" />
              </button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 border-primary",
                },
              }}
            />
          </div>
        </nav>

        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm sm:text-base">
            Here is your fitness journey history.
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[var(--color-text)]">
            <Calendar size={18} className="sm:w-5 sm:h-5 text-primary" /> Your
            Plans
          </h2>
          <Link href="/">
            <button className="w-full sm:w-auto px-4 py-2 bg-primary text-black rounded-lg font-bold hover:bg-primary-dark transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-primary/20">
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> New Plan
            </button>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-12 sm:py-20 glass-card rounded-2xl">
              <Dumbbell
                size={40}
                className="sm:w-12 sm:h-12 mx-auto text-[var(--color-text-secondary)] mb-4 opacity-50"
              />
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base">
                No plans generated yet.
              </p>
              <Link
                href="/"
                className="text-primary hover:underline mt-2 inline-block text-sm sm:text-base"
              >
                Create your first plan →
              </Link>
            </div>
          ) : (
            plans.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedPlan(item)}
                className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:border-primary/50 transition group relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                  <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-full uppercase">
                    {item.user_data.goal}
                  </span>
                  <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold mb-2 text-[var(--color-text)]">
                  {item.user_data.gender}, {item.user_data.age}yo
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6 line-clamp-2">
                  "{item.plan_data.motivation_quote}"
                </p>

                <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3 sm:pt-4">
                  <span>BMI: {item.bmi}</span>
                  <span className="group-hover:translate-x-1 transition-transform flex items-center text-[var(--color-text)] font-medium">
                    View <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
