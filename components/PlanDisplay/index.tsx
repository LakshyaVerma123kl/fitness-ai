"use client";
// components/PlanDisplay/index.tsx  — RAG-enhanced version
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Download,
  RefreshCw,
  Save,
  Star,
  Send,
  CheckCircle,
  Share2,
  Sparkles,
  Activity,
  Calendar,
  TrendingUp,
  ArrowUpCircle,
  Dumbbell,
  Utensils,
  ShoppingBag,
  Heart,
  AlertTriangle,
  CalendarPlus,
  Zap,
  X,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { downloadCalendar } from "../../utils/calendarExport";
import WorkoutView from "./WorkoutView";
import DietView from "./DietView";
import ShoppingView from "./ShoppingView";
import HealthView from "./HealthView";
import ImageModal from "./ImageModal";
import Toast from "../Toast";
import { generateAndDownloadPDF } from "../../utils/pdfExports";
import { generateGoogleCalendarUrl } from "../../utils/googleCalendar";

const MEAL_ORDER = [
  "breakfast",
  "mid_morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
];
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
export default function PlanDisplay({
  plan,
  reset,
  onRegenerate,
  userData,
}: {
  plan: any;
  reset: any;
  onRegenerate?: (adaptive: boolean) => void;
  userData?: any;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [imageModalData, setImageModalData] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "workout" | "diet" | "health" | "shopping"
  >("workout");
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set(),
  );
  const { isSignedIn } = useAuth();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  // ── Feedback modal state ──────────────────────────────────────
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (!plan) return null;

  const hasWorkout = plan.workout && Array.isArray(plan.workout);
  const hasDiet = plan.diet && typeof plan.diet === "object";
  const hasHealthInfo =
    plan.health_considerations ||
    plan.hydration ||
    plan.recovery ||
    plan.progress_tracking;

  const totalExercises = useMemo(() => {
    if (!hasWorkout) return 0;
    return plan.workout.reduce(
      (acc: number, day: any) => acc + (day.exercises?.length || 0),
      0,
    );
  }, [plan.workout]);

  const progressPercentage = Math.round(
    (completedExercises.size / (totalExercises || 1)) * 100,
  );

  const shoppingList = useMemo(() => {
    if (!hasDiet) return [];
    const items: string[] = [];
    const mealsSource = plan.diet.meals || plan.diet;
    if (mealsSource) {
      Object.values(mealsSource).forEach((meal: any) => {
        if (meal.portion) items.push(meal.portion);
      });
    }
    if (plan.supplements && Array.isArray(plan.supplements)) {
      plan.supplements.forEach((s: string) => items.push(`Supplement: ${s}`));
    }
    return items;
  }, [plan.diet, plan.supplements]);

  // ── Handlers ─────────────────────────────────────────────────

  const toggleExercise = (name: string) => {
    const newSet = new Set(completedExercises);
    newSet.has(name) ? newSet.delete(name) : newSet.add(name);
    setCompletedExercises(newSet);
  };

  const speakPlan = (section: "workout" | "diet" | "all") => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    let fullText = "";

    if (section === "workout" || section === "all") {
      fullText += "Here is your Workout Plan. ";
      if (hasWorkout) {
        plan.workout.forEach((day: any) => {
          fullText += `${day.day}. Focus on ${day.focus}. `;
          day.exercises?.forEach((ex: any) => {
            fullText += `${ex.name}, ${ex.sets} sets of ${ex.reps} reps. `;
          });
        });
      }
    }
    if (section === "diet" || section === "all") {
      fullText += "Here is your Diet Plan. ";
      const mealsSource = plan.diet.meals || plan.diet;
      if (hasDiet && mealsSource) {
        MEAL_ORDER.forEach((mealType) => {
          const details = mealsSource[mealType];
          if (details) fullText += `For ${mealType}, have ${details.meal}. `;
        });
      }
    }

    const chunks = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.rate = 1;
      utterance.pitch = 1;
      if (index === chunks.length - 1)
        utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    });
  };

  const generateImage = async (prompt: string, type: string) => {
    setGeneratingImage(true);
    setImageModalData({ prompt, type, image: null });
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type }),
      });
      const data = await res.json();
      if (data.imageUrl)
        setImageModalData({ prompt, type, image: data.imageUrl });
    } catch (error) {
      console.error("Image generation failed:", error);
    } finally {
      setGeneratingImage(false);
    }
  };

  // ── Save plan — opens feedback modal on success ───────────────
  const savePlan = async () => {
    if (!isSignedIn) {
      setToast({
        show: true,
        message: "⚠️ Please Sign In to save!",
        type: "warning",
      });
      return;
    }
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userData }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setToast({
          show: true,
          message: "⚠️ Session expired.",
          type: "warning",
        });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setToast({ show: true, message: "✅ Plan saved!", type: "success" });

      // Open feedback modal with the new plan's DB id
      if (data?.data?.id) {
        setSavedPlanId(data.data.id);
        // Small delay so the save toast is readable first
        setTimeout(() => setShowFeedbackModal(true), 1200);
      }
    } catch (e: any) {
      setToast({
        show: true,
        message: `❌ Error: ${e.message}`,
        type: "error",
      });
    }
  };

  const sharePlan = () => {
    const text = `Check out my AI Fitness Plan! Goal: ${userData?.goal}. \n\nQuote: "${plan.motivation_quote}"`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20 px-4 md:px-6">
      {/* RAG badge — shows when plan was enhanced by similar user data */}
      {plan._metadata?.ragEnhanced && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-full px-4 py-1.5 w-fit mx-auto"
        >
          <Zap size={12} className="fill-[var(--color-primary)]" />
          AI-enhanced using similar users' top-rated plans
        </motion.div>
      )}

      {/* Motivation quote */}
      {plan.motivation_quote && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mt-4"
        >
          <div className="glass-card inline-block px-6 py-5 md:px-8 md:py-6 rounded-2xl border border-[var(--color-primary)] border-opacity-30 bg-gradient-to-r from-purple-900/10 to-blue-900/10 w-full md:w-auto">
            <Sparkles className="inline-block text-yellow-400 mb-3" size={24} />
            <p className="text-[var(--color-text)] text-lg md:text-xl italic font-light">
              "{plan.motivation_quote}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {plan._metadata?.bmi && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] rounded-full border border-[var(--color-border)] text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
            <Activity size={14} className="text-blue-400" />
            BMI: <strong>{plan._metadata.bmi}</strong>
          </div>
        )}
        {plan._metadata?.bmr && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] rounded-full border border-[var(--color-border)] text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
            <TrendingUp size={14} className="text-green-400" />
            BMR: <strong>{plan._metadata.bmr}</strong> kcal
          </div>
        )}
        {plan._metadata?.tdee && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] rounded-full border border-[var(--color-border)] text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
            <Activity size={14} className="text-purple-400" />
            TDEE: <strong>{plan._metadata.tdee}</strong> kcal
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] rounded-full border border-[var(--color-border)] text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
          <Dumbbell size={14} className="text-green-400" />
          Level: <strong>{userData?.level || "N/A"}</strong>
        </div>
      </div>

      {/* Safety warnings banner */}
      {plan.safety_warnings && plan.safety_warnings.length > 0 && (
        <div className="p-4 md:p-5 rounded-xl bg-red-500/10 border-2 border-red-500/50 flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-400 shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-red-400 mb-2">
              ⚠️ Important Safety Information
            </h4>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
              {plan.safety_warnings.slice(0, 2).map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            {plan.safety_warnings.length > 2 && (
              <button
                onClick={() => setActiveTab("health")}
                className="text-xs text-red-400 hover:text-red-300 underline mt-2"
              >
                View all {plan.safety_warnings.length} warnings →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {plan.results_timeline && (
        <div className="glass-card p-5 md:p-6 rounded-2xl border border-[var(--color-border)]">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="shrink-0 flex items-center gap-3 md:w-1/4">
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text)]">
                  Projected Timeline
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Based on consistency
                </p>
              </div>
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
                    Expected Start
                  </h4>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {plan.results_timeline.estimated_start}
                </p>
              </div>
              <div className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-yellow-400" />
                  <h4 className="text-sm font-bold text-[var(--color-text)]">
                    Key Milestones
                  </h4>
                </div>
                <ul className="space-y-1">
                  {plan.results_timeline.milestones?.map(
                    (m: string, i: number) => (
                      <li
                        key={i}
                        className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-yellow-500 mt-0.5">•</span> {m}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level-up nudge */}
      {progressPercentage >= 80 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-blue-500/20 border border-[var(--color-primary)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-primary)] rounded-full text-black">
              <ArrowUpCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-text)]">
                Crushing it!
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                You've completed {progressPercentage}% of this plan.
              </p>
            </div>
          </div>
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(true)}
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black text-xs font-bold rounded-lg transition whitespace-nowrap"
            >
              Level Up Plan 🚀
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => speakPlan("all")}
          className="px-3 md:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}{" "}
          {speaking ? "Stop" : "Listen"}
        </button>

        <button
          onClick={() => {
            downloadCalendar(plan);
            setToast({
              show: true,
              message: "📅 Added to Calendar!",
              type: "success",
            });
          }}
          className="px-3 md:px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <CalendarPlus size={16} />
          <span className="hidden sm:inline">Add to Cal</span>
        </button>

        <button
          onClick={() => {
            const url = generateGoogleCalendarUrl(plan);
            if (url) window.open(url, "_blank");
            setToast({
              show: true,
              message: "📅 Opening Google Calendar…",
              type: "success",
            });
          }}
          className="px-3 md:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <CalendarPlus size={16} />
          <span className="hidden sm:inline">Add to GCal</span>
        </button>

        <button
          onClick={() =>
            generateAndDownloadPDF(plan, userData, shoppingList, setToast)
          }
          className="px-3 md:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} /> PDF
        </button>

        <button
          onClick={savePlan}
          className="px-3 md:px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <Save size={16} /> Save
        </button>

        <button
          onClick={sharePlan}
          className="px-3 md:px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <Share2 size={16} /> Share
        </button>

        {onRegenerate && (
          <button
            onClick={() => onRegenerate(false)}
            className="col-span-2 sm:col-span-1 px-3 md:px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} /> Retry
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-start sm:justify-center gap-2 md:gap-4 border-b border-[var(--color-border)] pb-0 overflow-x-auto no-scrollbar snap-x">
        {[
          { id: "workout", label: "Workout", icon: Dumbbell },
          { id: "diet", label: "Diet & Macros", icon: Utensils },
          {
            id: "health",
            label: "Health & Recovery",
            icon: Heart,
            show: hasHealthInfo,
          },
          { id: "shopping", label: "Shopping List", icon: ShoppingBag },
        ]
          .filter((tab) => tab.show !== false)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-t-xl transition-all whitespace-nowrap snap-start text-sm md:text-base shrink-0 ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "workout" && (
            <WorkoutView
              key="workout"
              plan={plan}
              completedExercises={completedExercises}
              toggleExercise={toggleExercise}
              onGenerateImage={generateImage}
            />
          )}
          {activeTab === "diet" && (
            <DietView key="diet" plan={plan} onGenerateImage={generateImage} />
          )}
          {activeTab === "health" && <HealthView key="health" plan={plan} />}
          {activeTab === "shopping" && (
            <ShoppingView key="shopping" shoppingList={shoppingList} />
          )}
        </AnimatePresence>
      </div>

      {/* Image modal */}
      {imageModalData && (
        <ImageModal
          data={imageModalData}
          loading={generatingImage}
          onClose={() => setImageModalData(null)}
        />
      )}

      {/* ── Feedback modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showFeedbackModal && savedPlanId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-6 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-card)] relative shadow-2xl"
            >
              {/* Close */}
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-[var(--color-text)]/10 rounded-full transition"
              >
                <X size={18} className="text-[var(--color-text-secondary)]" />
              </button>

              <div className="mb-5">
                <h3 className="text-lg font-black text-[var(--color-text)]">
                  Rate your plan ⭐
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Your rating helps our AI generate better plans for people like
                  you.
                </p>
              </div>

              <FeedbackWidget
                planId={savedPlanId}
                onDone={() => setShowFeedbackModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[var(--color-border)] text-[10px] md:text-xs text-[var(--color-text-secondary)] px-4">
        <p>
          ⚠️ <strong>Disclaimer:</strong> This is an AI-generated plan. Please
          consult a healthcare professional before starting any new exercise or
          diet program.
        </p>
      </div>

      <button
        onClick={reset}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors text-xs md:text-sm w-full text-center mt-4 flex items-center justify-center gap-2 pb-4"
      >
        ← Start Over
      </button>

      {/* Toast */}
      {toast?.show && (
        <div className="fixed top-4 right-4 sm:right-6 md:right-8 lg:right-12 z-50 w-[calc(100%-2rem)] sm:w-96 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={4000}
          />
        </div>
      )}
    </div>
  );
}
