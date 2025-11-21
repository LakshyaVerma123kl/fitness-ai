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
  Trash2,
  AlertTriangle,
  X,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanDisplay from "@/components/PlanDisplay";
import ProgressTracker from "@/components/ProgressTracker";
import Toast from "@/components/Toast";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  // --- State Management ---
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [latestGoal, setLatestGoal] = useState<string>("");

  // Delete Modal State
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Auto-Progression State
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [progressionType, setProgressionType] = useState<
    "levelup" | "maintain"
  >("maintain");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Data on Load
  useEffect(() => {
    if (isLoaded && user) {
      fetchPlansAndCheckProgress();
    }
  }, [isLoaded, user]);

  // --- Core Data Fetching ---
  const fetchPlansAndCheckProgress = async () => {
    try {
      // 1. Fetch User Plans
      const plansRes = await fetch("/api/plans");
      const plansData = await plansRes.json();

      if (Array.isArray(plansData)) {
        setPlans(plansData);

        // If we have plans, extract the latest goal and check for progression
        if (plansData.length > 0) {
          const newestPlan = plansData[0];
          setLatestGoal(newestPlan.user_data?.goal);

          // 2. Trigger Auto-Progression Check
          await checkAutoProgression(newestPlan);
        }
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 🧠 Auto-Progression Logic ---
  const checkAutoProgression = async (currentPlan: any) => {
    // 1. Debounce check: Don't check if we already checked today
    const lastCheck = localStorage.getItem(
      `progression_check_${currentPlan.id}`
    );
    const todayStr = new Date().toISOString().split("T")[0];
    if (lastCheck === todayStr) return;

    // 2. Calculate Plan Age
    const planDate = new Date(currentPlan.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - planDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 3. Only check if plan is at least 7 days old
    if (diffDays >= 7) {
      const progressRes = await fetch("/api/progress");
      const progressData = await progressRes.json();

      if (progressData.entries) {
        // Get entries from the last 7 days
        const last7DaysEntries = progressData.entries.slice(-7);
        const completedCount = last7DaysEntries.filter(
          (e: any) => e.workout_completed
        ).length;

        // IF: Completed 5+ workouts in last 7 days -> Level Up
        if (completedCount >= 5) {
          setProgressionType("levelup");
          setShowProgressionModal(true);
        }
      }

      // Mark checked for today
      localStorage.setItem(`progression_check_${currentPlan.id}`, todayStr);
    }
  };

  const handleAutoRegenerate = async () => {
    if (!plans[0]) return;

    const userData = plans[0].user_data;
    const nextUserData = { ...userData };

    // Increase Difficulty Logic
    if (progressionType === "levelup") {
      if (userData.level === "Beginner") nextUserData.level = "Intermediate";
      else if (userData.level === "Intermediate")
        nextUserData.level = "Advanced";
      // You could also slightly increase weights or change goals here
    }

    setLoading(true);
    setShowProgressionModal(false);

    try {
      // 1. Generate New Plan
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextUserData),
      });

      if (!res.ok) throw new Error("Generation failed");
      const newPlan = await res.json();

      // 2. Save New Plan
      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan, userData: nextUserData }),
      });

      // 3. Refresh Dashboard
      await fetchPlansAndCheckProgress();
      setToast({
        show: true,
        message: "🚀 Plan Leveled Up Successfully!",
        type: "success",
      });
    } catch (error) {
      setToast({
        show: true,
        message: "Failed to level up plan.",
        type: "error",
      });
      setLoading(false);
    }
  };

  // --- Delete Handlers ---
  const handleDeleteClick = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlanToDelete(planId);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    try {
      const res = await fetch(`/api/plans?id=${planToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== planToDelete));
        setToast({ show: true, message: "Plan deleted", type: "success" });
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      setToast({ show: true, message: "Error deleting plan", type: "error" });
    } finally {
      setPlanToDelete(null);
    }
  };

  // --- Loading State ---
  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark)]">
        <Loader2
          className="animate-spin text-[var(--color-primary)]"
          size={48}
        />
      </div>
    );

  // --- Detailed Plan View ---
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] transition-colors duration-300">
        <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50">
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)]">
            FITNESS<span className="text-[var(--color-primary)]">AI</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPlan(null)}
              className="px-3 sm:px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-xs sm:text-sm font-medium hover:opacity-80 flex items-center gap-2 transition text-[var(--color-text)]"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border-2 border-[var(--color-primary)]",
                },
              }}
            />
          </div>
        </nav>
        <PlanDisplay
          plan={selectedPlan.plan_data}
          userData={selectedPlan.user_data}
          reset={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  // --- Main Dashboard View ---
  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] p-4 sm:p-6 md:p-12 transition-colors duration-300 relative">
      <div className="max-w-6xl mx-auto">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-8 sm:mb-12">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)] hover:opacity-80 transition">
              FITNESS<span className="text-[var(--color-primary)]">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-[var(--color-card)] rounded-full border border-transparent hover:border-[var(--color-border)] transition"
              >
                {theme === "dark" ? (
                  <Sun className="text-[var(--color-primary)]" size={20} />
                ) : (
                  <Moon className="text-[var(--color-primary)]" size={20} />
                )}
              </button>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-9 h-9 sm:w-10 sm:h-10 border-2 border-[var(--color-primary)]",
                },
              }}
            />
          </div>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm sm:text-base">
            Here is your fitness journey history.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-12">
          <ProgressTracker userId={user?.id || ""} userGoal={latestGoal} />
        </div>

        {/* Plans Grid Header */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center gap-4 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[var(--color-text)]">
            <Calendar size={20} className="text-[var(--color-primary)]" /> Your
            Plans
          </h2>
          <Link href="/">
            <button className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-bold hover:bg-[var(--color-primary-dark)] transition flex items-center gap-2 shadow-lg text-sm sm:text-base">
              <Plus size={18} /> New Plan
            </button>
          </Link>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2
                className="animate-spin text-[var(--color-primary)]"
                size={48}
              />
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center py-12 sm:py-20 glass-card rounded-2xl">
              <Dumbbell
                size={40}
                className="mx-auto text-[var(--color-text-secondary)] mb-4 opacity-50"
              />
              <p className="text-[var(--color-text-secondary)]">
                No plans generated yet.
              </p>
              <Link
                href="/"
                className="text-[var(--color-primary)] hover:underline mt-2 inline-block"
              >
                Create your first plan →
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              {plans.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedPlan(item)}
                  className="glass-card p-5 sm:p-6 rounded-xl sm:rounded-2xl hover:border-[var(--color-primary)] transition group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold rounded-full uppercase border border-[var(--color-primary)] border-opacity-20">
                      {item.user_data.goal}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        className="p-2 hover:bg-red-500/10 rounded-full text-[var(--color-text-secondary)] hover:text-red-500 transition-colors z-10"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-[var(--color-text)]">
                    {item.user_data.gender}, {item.user_data.age}yo
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6 line-clamp-2">
                    "{item.plan_data.motivation_quote}"
                  </p>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-4">
                    <span>BMI: {item.bmi}</span>
                    <span className="group-hover:translate-x-1 transition-transform flex items-center text-[var(--color-text)] font-medium">
                      View{" "}
                      <ChevronRight
                        size={16}
                        className="text-[var(--color-primary)]"
                      />
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- AUTO PROGRESSION MODAL --- */}
      <AnimatePresence>
        {showProgressionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md p-8 rounded-3xl border border-[var(--color-primary)] shadow-[0_0_50px_rgba(0,229,153,0.2)] relative bg-[var(--color-card)]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-[var(--color-primary)]"></div>
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-[var(--color-primary)]/10 rounded-full mb-6 border border-[var(--color-primary)]/20">
                  <Award size={48} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">
                  Level Up Available! 🚀
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed text-sm sm:text-base">
                  You've been consistent for the last 7 days! Your body is ready
                  for a bigger challenge. Shall we regenerate your plan for the{" "}
                  <strong>Next Level</strong>?
                </p>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowProgressionModal(false)}
                    className="py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition font-bold text-sm sm:text-base"
                  >
                    No, keep current
                  </button>
                  <button
                    onClick={handleAutoRegenerate}
                    className="py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-bold hover:opacity-90 transition shadow-lg text-sm sm:text-base"
                  >
                    Yes, Level Up!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE MODAL --- */}
      <AnimatePresence>
        {planToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-6 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-card)] relative shadow-2xl"
            >
              <button
                onClick={() => setPlanToDelete(null)}
                className="absolute top-4 right-4 p-1 hover:bg-[var(--color-text)]/10 rounded-full transition-colors"
              >
                <X size={20} className="text-[var(--color-text-secondary)]" />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-red-500/10 rounded-full mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                  Delete Plan?
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPlanToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-border)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 shadow-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
