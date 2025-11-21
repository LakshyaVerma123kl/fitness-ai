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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanDisplay from "@/components/PlanDisplay";
import ProgressTracker from "@/components/ProgressTracker";
import Toast from "@/components/Toast";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [latestGoal, setLatestGoal] = useState<string>(""); // State for the goal

  // State for Delete Modal
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

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
      if (Array.isArray(data)) {
        setPlans(data);
        // Extract goal from the newest plan (index 0 because backend sorts DESC)
        if (data.length > 0 && data[0].user_data?.goal) {
          setLatestGoal(data[0].user_data.goal);
        }
      }
    } catch (err) {
      console.error("Failed to load plans", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Open Modal
  const handleDeleteClick = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlanToDelete(planId);
  };

  // 2. Confirm Delete
  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      const res = await fetch(`/api/plans?id=${planToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== planToDelete));
        setToast({
          show: true,
          message: "Plan deleted successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      setToast({
        show: true,
        message: "Error deleting plan",
        type: "error",
      });
    } finally {
      setPlanToDelete(null); // Close modal
    }
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark)] text-[var(--color-primary)]">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] transition-colors duration-300">
        <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)] cursor-pointer hover:opacity-80 transition">
              FITNESS<span className="text-[var(--color-primary)]">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-[var(--color-card)] rounded-full transition border border-transparent hover:border-[var(--color-border)]"
              >
                {theme === "dark" ? (
                  <Sun className="text-[var(--color-primary)]" size={20} />
                ) : (
                  <Moon className="text-[var(--color-primary)]" size={20} />
                )}
              </button>
            )}
            {!mounted && <div className="w-9 h-9" />}

            <button
              onClick={() => setSelectedPlan(null)}
              className="px-3 sm:px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-xs sm:text-sm font-medium hover:opacity-80 flex items-center gap-1 sm:gap-2 transition text-[var(--color-text)]"
            >
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="inline sm:hidden">Back</span>
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 sm:w-9 sm:h-9 border-2 border-[var(--color-primary)]",
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

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] p-4 sm:p-6 md:p-12 transition-colors duration-300 relative">
      <div className="max-w-6xl mx-auto">
        <nav className="flex justify-between items-center mb-8 sm:mb-12">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)] cursor-pointer hover:opacity-80 transition">
              FITNESS<span className="text-[var(--color-primary)]">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-[var(--color-card)] rounded-full transition border border-transparent hover:border-[var(--color-border)]"
              >
                {theme === "dark" ? (
                  <Sun className="text-[var(--color-primary)]" size={20} />
                ) : (
                  <Moon className="text-[var(--color-primary)]" size={20} />
                )}
              </button>
            )}
            {!mounted && <div className="w-9 h-9" />}

            <Link href="/">
              <button
                className="p-2 hover:bg-[var(--color-card)] rounded-full transition border border-transparent hover:border-[var(--color-border)]"
                title="Home"
              >
                <Home size={20} className="text-[var(--color-primary)]" />
              </button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 border-[var(--color-primary)]",
                },
              }}
            />
          </div>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm sm:text-base">
            Here is your fitness journey history.
          </p>
        </div>

        {/* Pass userGoal to ProgressTracker */}
        <div className="mb-12">
          <ProgressTracker userId={user?.id || ""} userGoal={latestGoal} />
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-[var(--color-text)]">
            <Calendar
              size={18}
              className="sm:w-5 sm:h-5 text-[var(--color-primary)]"
            />{" "}
            Your Plans
          </h2>
          <Link href="/">
            <button className="w-full sm:w-auto px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-bold hover:bg-[var(--color-primary-dark)] transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg">
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> New Plan
            </button>
          </Link>
        </div>

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
                className="sm:w-12 sm:h-12 mx-auto text-[var(--color-text-secondary)] mb-4 opacity-50"
              />
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base">
                No plans generated yet.
              </p>
              <Link
                href="/"
                className="text-[var(--color-primary)] hover:underline mt-2 inline-block text-sm sm:text-base"
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
                  className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:border-[var(--color-primary)] transition group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <span className="px-2 sm:px-3 py-1 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold rounded-full uppercase border border-[var(--color-primary)] border-opacity-20">
                      {item.user_data.goal}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        className="p-2 hover:bg-red-500/10 rounded-full text-[var(--color-text-secondary)] hover:text-red-500 transition-colors z-10"
                        title="Delete Plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                      View{" "}
                      <ChevronRight
                        size={14}
                        className="sm:w-4 sm:h-4 text-[var(--color-primary)]"
                      />
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                  This action cannot be undone. Are you sure you want to remove
                  this workout plan from your history?
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPlanToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-border)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
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
