"use client";
// app/dashboard/page.tsx — RAG-enhanced version
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
  CheckCircle,
  Send,
  Moon,
  Sun,
  Home,
  Trash2,
  AlertTriangle,
  X,
  Award,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanDisplay from "@/components/PlanDisplay";
import ProgressTracker from "@/components/ProgressTracker";

import Toast from "@/components/Toast";
// Paste this BEFORE `export default function Dashboard()`
// Also add  Star, Send, CheckCircle  to your lucide-react imports

function FeedbackWidget({
  planId,
  onDone,
}: {
  planId: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState("");

  const ratingLabels: { [k: number]: string } = {
    1: "Not helpful",
    2: "Could be better",
    3: "Pretty good",
    4: "Great plan!",
    5: "Absolutely loved it! 🔥",
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setFbLoading(true);
    setFbError("");
    try {
      const res = await fetch("/api/plans/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, rating, feedbackNote: note }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setSubmitted(true);
      setTimeout(() => onDone?.(), 1500);
    } catch (e: any) {
      setFbError(e.message || "Something went wrong");
    } finally {
      setFbLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-6"
      >
        <CheckCircle size={40} className="text-[var(--color-primary)]" />
        <p className="font-bold text-[var(--color-text)]">
          Thanks for your feedback! 🙌
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] text-center max-w-xs">
          Your rating helps improve plans for everyone with a similar profile.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= (hovered || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[var(--color-border)] fill-transparent"
              }`}
            />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {(hovered || rating) > 0 && (
          <motion.p
            key={hovered || rating}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-semibold text-[var(--color-primary)]"
          >
            {ratingLabels[hovered || rating]}
          </motion.p>
        )}
      </AnimatePresence>
      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any feedback? What worked / what didn't? (optional)"
            rows={2}
            className="w-full p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none resize-none transition-colors"
          />
        </motion.div>
      )}
      {fbError && <p className="text-xs text-red-400 text-center">{fbError}</p>}
      <button
        onClick={handleSubmit}
        disabled={!rating || fbLoading}
        className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {fbLoading ? (
          <span className="animate-pulse">Submitting…</span>
        ) : (
          <>
            <Send size={16} /> Submit Feedback
          </>
        )}
      </button>
    </motion.div>
  );
}
export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [latestGoal, setLatestGoal] = useState<string>("");

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [showProgressionModal, setShowProgressionModal] = useState(false);

  // ── Feedback state ────────────────────────────────────────────
  const [feedbackPlanId, setFeedbackPlanId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && user) fetchPlansAndCheckProgress();
  }, [isLoaded, user]);

  const fetchPlansAndCheckProgress = async () => {
    try {
      const plansRes = await fetch("/api/plans");
      const plansData = await plansRes.json();

      if (Array.isArray(plansData)) {
        setPlans(plansData);
        if (plansData.length > 0) {
          const newestPlan = plansData[0];
          setLatestGoal(newestPlan.user_data?.goal);
          await checkAutoProgression(newestPlan);
        }
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAutoProgression = async (currentPlan: any) => {
    const lastCheck = localStorage.getItem(
      `progression_check_${currentPlan.id}`,
    );
    const todayStr = new Date().toISOString().split("T")[0];
    if (lastCheck === todayStr) return;

    const planDate = new Date(currentPlan.created_at);
    const diffDays = Math.ceil(
      Math.abs(new Date().getTime() - planDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diffDays >= 7) {
      const progressRes = await fetch("/api/progress");
      const progressData = await progressRes.json();
      if (progressData.entries) {
        const completedCount = progressData.entries
          .slice(-7)
          .filter((e: any) => e.workout_completed).length;
        if (completedCount >= 5) setShowProgressionModal(true);
      }
      localStorage.setItem(`progression_check_${currentPlan.id}`, todayStr);
    }
  };

  const handleManualRegenerate = async (targetPlan: any, adaptive: boolean) => {
    setLoading(true);
    setSelectedPlan(null);

    const userData = targetPlan.user_data;
    const nextUserData = { ...userData };

    if (adaptive) {
      if (userData.level === "Beginner") nextUserData.level = "Intermediate";
      else if (userData.level === "Intermediate")
        nextUserData.level = "Advanced";
      setToast({
        show: true,
        message: "⚡️ Leveling up your plan…",
        type: "success",
      });
    } else {
      setToast({
        show: true,
        message: "🔄 Regenerating plan…",
        type: "success",
      });
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextUserData),
      });
      if (!res.ok) throw new Error("Generation failed");
      const newPlan = await res.json();

      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan, userData: nextUserData }),
      });

      if (
        adaptive &&
        userData.emailNotifications &&
        user?.primaryEmailAddress?.emailAddress
      ) {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.primaryEmailAddress.emailAddress,
            name: user.firstName || "Athlete",
            type: "levelup",
          }),
        });
      }

      await fetchPlansAndCheckProgress();
      setToast({
        show: true,
        message: adaptive ? "🚀 Level Up Complete!" : "✅ Plan Regenerated!",
        type: "success",
      });
    } catch {
      setToast({
        show: true,
        message: "Failed to update plan.",
        type: "error",
      });
      setLoading(false);
    }
  };

  const handleAutoRegenerate = async () => {
    if (!plans[0]) return;
    setShowProgressionModal(false);
    await handleManualRegenerate(plans[0], true);
  };

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
      } else throw new Error("Failed");
    } catch {
      setToast({ show: true, message: "Error deleting plan", type: "error" });
    } finally {
      setPlanToDelete(null);
    }
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark)]">
        <Loader2
          className="animate-spin text-[var(--color-primary)]"
          size={48}
        />
      </div>
    );

  // ── Detailed plan view ────────────────────────────────────────
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-text)] transition-colors duration-300">
        <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50">
          <Link href="/" className="hover:opacity-80 transition">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[var(--color-text)]">
              FITNESS<span className="text-[var(--color-primary)]">AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
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
            <Link href="/">
              <button
                className="p-2 hover:bg-[var(--color-card)] rounded-full transition border border-transparent hover:border-[var(--color-border)]"
                title="Home"
              >
                <Home size={20} className="text-[var(--color-primary)]" />
              </button>
            </Link>
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
          onRegenerate={(adaptive) =>
            handleManualRegenerate(selectedPlan, adaptive)
          }
        />
      </div>
    );
  }

  // ── Main dashboard view ───────────────────────────────────────
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

        {/* Plans header */}
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

        {/* Plans grid */}
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

                      {/* ── Rate button (only if not yet rated) ── */}
                      {!item.rating && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeedbackPlanId(item.id);
                          }}
                          className="p-2 hover:bg-yellow-400/10 rounded-full text-[var(--color-text-secondary)] hover:text-yellow-400 transition-colors z-10"
                          title="Rate this plan"
                        >
                          <Star size={16} />
                        </button>
                      )}

                      {/* Show rating stars if already rated */}
                      {item.rating && (
                        <div
                          className="flex items-center gap-0.5"
                          title={`Rated ${item.rating}/5`}
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={
                                s <= item.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-600"
                              }
                            />
                          ))}
                        </div>
                      )}

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

      {/* ── Auto-progression modal ────────────────────────────── */}
      <AnimatePresence>
        {showProgressionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md p-8 rounded-3xl border border-[var(--color-primary)] shadow-[0_0_50px_rgba(0,229,153,0.2)] relative bg-[var(--color-card)]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-[var(--color-primary)]" />
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-[var(--color-primary)]/10 rounded-full mb-6 border border-[var(--color-primary)]/20">
                  <Award size={48} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text)] mb-2">
                  Level Up Available! 🚀
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed text-sm sm:text-base">
                  You've been consistent for the last 7 days! Shall we
                  regenerate your plan for the <strong>Next Level</strong>?
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowProgressionModal(false)}
                    className="py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition font-bold"
                  >
                    No, keep current
                  </button>
                  <button
                    onClick={handleAutoRegenerate}
                    className="py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-bold hover:opacity-90 transition shadow-lg"
                  >
                    Yes, Level Up!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Feedback modal (rate existing plan from card) ──────── */}
      <AnimatePresence>
        {feedbackPlanId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-6 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-card)] relative shadow-2xl"
            >
              <button
                onClick={() => setFeedbackPlanId(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-[var(--color-text)]/10 rounded-full transition"
              >
                <X size={18} className="text-[var(--color-text-secondary)]" />
              </button>
              <div className="mb-5">
                <h3 className="text-lg font-black text-[var(--color-text)]">
                  Rate this plan ⭐
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Your rating improves plans for everyone with a similar
                  profile.
                </p>
              </div>
              <FeedbackWidget
                planId={feedbackPlanId}
                onDone={() => {
                  setFeedbackPlanId(null);
                  fetchPlansAndCheckProgress(); // refresh so star shows on card
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete modal ──────────────────────────────────────── */}
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
