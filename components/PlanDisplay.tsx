"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Save,
  Sparkles,
  PieChart as PieChartIcon,
  ShoppingBag,
  CheckCircle,
  Dumbbell,
  Utensils,
  X,
  Share2,
  Activity,
  Calendar,
  TrendingUp,
  Zap,
  Youtube,
  ChefHat,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import Toast from "./Toast";

// 🎨 Chart Colors
const COLORS = ["#3b82f6", "#10b981", "#eab308"]; // Protein (Blue), Carbs (Green), Fats (Yellow)

// 🍽️ Meal Sequence
const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];

export default function PlanDisplay({
  plan,
  reset,
  onRegenerate,
  userData,
}: {
  plan: any;
  reset: any;
  onRegenerate?: any;
  userData?: any;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [imageModalData, setImageModalData] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"workout" | "diet" | "shopping">(
    "workout"
  );
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  if (!plan) return null;

  const hasWorkout = plan.workout && Array.isArray(plan.workout);
  const hasDiet = plan.diet && typeof plan.diet === "object";

  // 📊 Calculate Macros for Chart
  const macroData = useMemo(() => {
    if (!hasDiet) return [];

    // Priority: Use explicit macros from API if available
    if (plan.diet.macros) {
      return [
        { name: "Protein", value: parseInt(plan.diet.macros.protein) || 0 },
        { name: "Carbs", value: parseInt(plan.diet.macros.carbs) || 0 },
        { name: "Fats", value: parseInt(plan.diet.macros.fats) || 0 },
      ];
    }

    // Fallback: Sum up meals
    let p = 0,
      c = 0,
      f = 0;
    const mealsSource = plan.diet.meals || plan.diet;
    if (mealsSource) {
      Object.values(mealsSource).forEach((meal: any) => {
        p += parseInt(meal.protein) || 0;
        c += parseInt(meal.carbs) || 0;
        f += parseInt(meal.fats) || 0;
      });
    }

    return [
      { name: "Protein", value: p },
      { name: "Carbs", value: c },
      { name: "Fats", value: f },
    ];
  }, [plan.diet]);

  // 🛒 Generate Shopping List
  const shoppingList = useMemo(() => {
    if (!hasDiet) return [];
    const items: string[] = [];

    const mealsSource = plan.diet.meals || plan.diet;

    Object.values(mealsSource).forEach((meal: any) => {
      if (meal.portion) items.push(meal.portion);
    });

    if (plan.supplements && Array.isArray(plan.supplements)) {
      plan.supplements.forEach((s: string) => items.push(`Supplement: ${s}`));
    }

    return items;
  }, [plan.diet, plan.supplements]);

  // ✅ Toggle Exercise Checkbox
  const toggleExercise = (name: string) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setCompletedExercises(newSet);
  };

  // 🔊 FUNCTION: Speak Plan
  const speakPlan = async (section: "workout" | "diet" | "all") => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    let textToSpeak = "";

    if (section === "workout" || section === "all") {
      textToSpeak += "Here is your Workout Plan. ";
      if (hasWorkout) {
        plan.workout.forEach((day: any) => {
          textToSpeak += `${day.day}. Focus on ${day.focus}. `;
          day.exercises?.forEach((ex: any) => {
            textToSpeak += `${ex.name}, ${ex.sets} sets of ${ex.reps} reps. `;
          });
        });
      }
    }

    if (section === "diet" || section === "all") {
      textToSpeak += "Here is your Diet Plan. ";
      const mealsSource = plan.diet.meals || plan.diet;
      if (hasDiet) {
        // Speak in specific order
        MEAL_ORDER.forEach((mealType) => {
          const details = mealsSource[mealType];
          if (details) {
            textToSpeak += `For ${mealType}, have ${details.meal}. `;
          }
        });
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // 🎨 FUNCTION: Generate Image
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
      if (data.imageUrl) {
        setImageModalData({ prompt, type, image: data.imageUrl });
      }
    } catch (error) {
      console.error("Image generation failed:", error);
    } finally {
      setGeneratingImage(false);
    }
  };

  // 📄 FUNCTION: Export Professional PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 14;

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Your Personalized Fitness Plan", margin, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Goal: ${userData?.goal || "General Fitness"} | Generated by Fitness AI`,
      margin,
      30
    );

    let yPos = 45;

    // Timeline
    if (plan.results_timeline) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Projected Timeline", margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Expected Start: ${plan.results_timeline.estimated_start}`,
        margin,
        yPos
      );
      yPos += 6;

      if (plan.results_timeline.milestones) {
        plan.results_timeline.milestones.forEach((m: string) => {
          doc.text(`• ${m}`, margin, yPos);
          yPos += 6;
        });
      }
      yPos += 10;
    }

    // Table: Workout
    if (hasWorkout) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Weekly Workout Routine", margin, yPos);
      yPos += 8;

      const workoutRows = plan.workout.map((day: any) => {
        const exercises = day.exercises
          .map((ex: any) => `• ${ex.name} (${ex.sets}x${ex.reps})`)
          .join("\n");
        return [day.day, day.focus, exercises];
      });

      autoTable(doc, {
        startY: yPos,
        head: [["Day", "Focus Area", "Exercises"]],
        body: workoutRows,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Table: Diet
    if (hasDiet) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Nutrition Plan", margin, yPos);
      yPos += 8;

      if (plan.diet.strategy) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80, 80, 80);
        doc.text(`Week 1 Focus: ${plan.diet.strategy.week_1}`, margin, yPos);
        yPos += 6;
        doc.text(`Week 2 Focus: ${plan.diet.strategy.week_2}`, margin, yPos);
        yPos += 10;
        doc.setTextColor(0, 0, 0);
      }

      const mealsSource = plan.diet.meals || plan.diet;

      // Use MEAL_ORDER to sort for PDF too
      const dietRows = MEAL_ORDER.filter((key) => mealsSource[key]) // Filter out if meal doesn't exist
        .map((mealType) => {
          const details = mealsSource[mealType];
          return [
            mealType.toUpperCase(),
            details.meal,
            `${details.calories} kcal\nP:${details.protein} C:${details.carbs} F:${details.fats}`,
          ];
        });

      autoTable(doc, {
        startY: yPos,
        head: [["Meal", "Suggestion", "Macros"]],
        body: dietRows,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // List: Shopping
    if (shoppingList.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Shopping List", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const listText = shoppingList.map((item) => `• ${item}`).join("\n");
      doc.text(listText, margin, yPos);
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        "Consult a doctor before starting any new diet or exercise routine.",
        margin,
        285
      );
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    doc.save("Fitness_Plan_Pro.pdf");
  };

  // 💾 FUNCTION: Save Plan (Toast Version)
  const savePlan = async () => {
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
          message: "⚠️ Please Sign In to save your plan!",
          type: "warning",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setToast({
        show: true,
        message: "✅ Plan saved to your Dashboard!",
        type: "success",
      });
    } catch (e: any) {
      console.error("Full Error Object:", e);
      setToast({
        show: true,
        message: `❌ Error: ${e.message}`,
        type: "error",
      });
    }
  };

  // 📤 FUNCTION: Share on WhatsApp
  const sharePlan = () => {
    const text = `Check out my AI Fitness Plan! Goal: ${userData?.goal}. \n\nQuote: "${plan.motivation_quote}"\n\nGenerated by Fitness AI.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const mealsSource = plan.diet?.meals || plan.diet;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20 px-4 md:px-6">
      {/* Header & Quote */}
      {plan.motivation_quote && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mt-4"
        >
          <div className="glass-card inline-block px-6 py-5 md:px-8 md:py-6 rounded-2xl border border-(--color-primary) border-opacity-30 bg-linear-to-r from-purple-900/10 to-blue-900/10 w-full md:w-auto">
            <Sparkles className="inline-block text-yellow-400 mb-3" size={24} />
            <p className="text-(--color-text) text-lg md:text-xl italic font-light">
              "{plan.motivation_quote}"
            </p>
          </div>
        </motion.div>
      )}
      [Image of healthy meal prep]
      {/* User Stats Badges */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {plan._bmi && (
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-(--color-card) rounded-full border border-(--color-border)] text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
            <Activity size={14} className="text-blue-400" />
            <span>
              BMI: <strong>{plan._bmi}</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-(--color-card) rounded-full border border-(--color-border) text-xs md:text-sm text-[var(--color-text-secondary)] shadow-sm">
          <Dumbbell size={14} className="text-green-400" />
          <span>
            Level: <strong>{userData?.level || "N/A"}</strong>
          </span>
        </div>
      </div>
      {/* 📅 Results Timeline Section */}
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
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global Actions */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => speakPlan("all")}
          className="px-3 md:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition flex items-center justify-center gap-2 text-sm"
        >
          {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {speaking ? "Stop" : "Listen"}
        </button>

        <button
          onClick={exportPDF}
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
            onClick={onRegenerate}
            className="col-span-2 sm:col-span-1 px-3 md:px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} /> Retry
          </button>
        )}
      </div>
      {/* TABS NAVIGATION */}
      <div className="flex justify-start sm:justify-center gap-2 md:gap-4 border-b border-[var(--color-border)] pb-0 overflow-x-auto no-scrollbar snap-x">
        {[
          { id: "workout", label: "Workout", icon: Dumbbell },
          { id: "diet", label: "Diet & Macros", icon: Utensils },
          { id: "shopping", label: "Shopping List", icon: ShoppingBag },
        ].map((tab) => (
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
      {/* CONTENT AREA */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* 🏋️ WORKOUT TAB */}
          {activeTab === "workout" && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6"
            >
              {hasWorkout ? (
                plan.workout.map((day: any, i: number) => (
                  <div
                    key={i}
                    className="glass-card p-4 md:p-6 rounded-2xl border border-[var(--color-border)]"
                  >
                    <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
                      <h3 className="text-lg md:text-xl font-bold text-[var(--color-text)]">
                        {day.day}
                      </h3>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs md:text-sm font-medium">
                        {day.focus}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {day.exercises?.map((ex: any, j: number) => (
                        <div
                          key={j}
                          className={`p-3 md:p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                            completedExercises.has(ex.name)
                              ? "bg-green-500/10 border border-green-500/30"
                              : "bg-[var(--color-card)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3 md:gap-4 w-full">
                            <button
                              onClick={() => toggleExercise(ex.name)}
                              className={`p-1 rounded-full transition-colors mt-1 sm:mt-0 shrink-0 ${
                                completedExercises.has(ex.name)
                                  ? "text-green-400"
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              }`}
                            >
                              <CheckCircle
                                size={22}
                                className="md:w-6 md:h-6"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium text-sm md:text-base truncate ${
                                  completedExercises.has(ex.name)
                                    ? "text-[var(--color-text-secondary)] line-through"
                                    : "text-[var(--color-text)]"
                                }`}
                              >
                                {ex.name}
                              </p>
                              <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
                                {ex.sets} sets × {ex.reps} reps • {ex.rest} rest
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Demo + YouTube */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                ex.name + " exercise form"
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex-1 sm:flex-none flex justify-center"
                              title="Watch Tutorial on YouTube"
                            >
                              <Youtube size={18} />
                            </a>

                            <button
                              onClick={() =>
                                generateImage(
                                  `fitness exercise: ${ex.name}, proper form, cinematic lighting`,
                                  "exercise"
                                )
                              }
                              className="p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-blue-400 flex items-center justify-center gap-2 opacity-100 transition-all hover:bg-black/5 dark:hover:bg-white/10 flex-1 sm:flex-none"
                              title="Generate AI Demo Image"
                            >
                              <ImageIcon size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[var(--color-text-secondary)]">
                  No workout data found.
                </p>
              )}
            </motion.div>
          )}

          {/* 🥗 DIET & MACROS TAB */}
          {activeTab === "diet" && (
            <motion.div
              key="diet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {/* Diet Strategies & Supplements */}
              <div className="lg:col-span-3 grid md:grid-cols-2 gap-4">
                {/* Weekly Strategies */}
                {plan.diet.strategy && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-[var(--color-border)]">
                    <h4 className="text-sm font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400" /> Weekly
                      Strategy
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                          Week 1
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {plan.diet.strategy.week_1}
                        </p>
                      </div>
                      <div className="border-t border-[var(--color-border)] pt-3">
                        <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">
                          Week 2
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {plan.diet.strategy.week_2}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supplements */}
                {plan.supplements && (
                  <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                    <h4 className="text-sm font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                      <Activity size={16} className="text-green-400" />{" "}
                      Recommended Supplements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {plan.supplements.map((item: string, i: number) => (
                        <span
                          key={i}
                          // Changed bg-opacity-10 to bg-opacity-5
                          // Changed border-opacity-20 to border-opacity-10
                          className="px-3 py-1 rounded-full bg-[var(--color-primary)] bg-opacity-5 border border-[var(--color-primary)] border-opacity-10 text-xs text-[var(--color-text-secondary)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Macro Chart Column */}
              <div className="lg:col-span-1 glass-card p-4 md:p-6 rounded-2xl h-fit lg:sticky lg:top-4 order-1 lg:order-1 border border-[var(--color-border)]">
                <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 text-[var(--color-text)]">
                  <PieChartIcon size={20} className="text-blue-400" />
                  Macro Split
                </h3>
                <div className="h-[220px] md:h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--color-text)",
                        }}
                        itemStyle={{ color: "var(--color-text)" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center border-t border-[var(--color-border)] pt-4">
                  <p className="text-xs md:text-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Daily Target
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
                    {plan.daily_calories}{" "}
                    <span className="text-xs md:text-sm font-normal text-[var(--color-text-secondary)]">
                      kcal
                    </span>
                  </p>
                </div>
              </div>

              {/* Meals Column */}
              <div className="lg:col-span-2 space-y-4 order-2 lg:order-2">
                {hasDiet && mealsSource
                  ? MEAL_ORDER.map((mealType) => {
                      // Only render this meal type if it exists in the data
                      if (!mealsSource[mealType]) return null;
                      const details = mealsSource[mealType];

                      return (
                        <div
                          key={mealType}
                          className="glass-card p-4 md:p-5 rounded-2xl bg-[var(--color-card)] flex gap-3 md:gap-4 items-start hover:shadow-lg transition-all group relative overflow-hidden border border-[var(--color-border)]"
                        >
                          <div
                            className={`w-1.5 self-stretch rounded-full shrink-0 ${
                              mealType === "breakfast"
                                ? "bg-yellow-500"
                                : mealType === "lunch"
                                ? "bg-green-500"
                                : mealType === "dinner"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="capitalize text-[var(--color-text-secondary)] text-[10px] md:text-xs font-bold tracking-wider mb-1">
                                {mealType}
                              </h4>
                              <div className="flex gap-2">
                                {/* Recipe Search Button */}
                                <a
                                  href={`https://www.google.com/search?q=${encodeURIComponent(
                                    "healthy recipe for " + details.meal
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-green-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title="Find Recipe"
                                >
                                  <ChefHat size={16} />
                                </a>
                                {/* AI Image Button */}
                                <button
                                  onClick={() =>
                                    generateImage(
                                      `${details.meal}, professional food photography, appetizing, 4k`,
                                      "food"
                                    )
                                  }
                                  className="text-gray-400 hover:text-blue-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title="Visualize Meal"
                                >
                                  <ImageIcon size={16} />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-[var(--color-text)] mb-2 wrap-break-words">
                              {details.meal}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-[var(--color-text-secondary)] font-mono">
                              <span className="bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                                {details.protein} Protein
                              </span>
                              <span className="bg-green-500/10 border border-green-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                                {details.carbs} Carbs
                              </span>
                              <span className="bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                                {details.fats} Fats
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-2 italic border-t border-[var(--color-border)] pt-2">
                              Portion: {details.portion}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  : null}
              </div>
            </motion.div>
          )}

          {/* 🛒 SHOPPING LIST TAB */}
          {activeTab === "shopping" && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-4 md:p-8 rounded-2xl border border-[var(--color-border)] max-w-2xl mx-auto"
            >
              <h3 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-4 md:mb-6 flex items-center gap-3">
                <ShoppingBag className="text-green-400" />
                Grocery List
              </h3>
              <div className="space-y-3 md:space-y-4">
                {shoppingList.length > 0 ? (
                  shoppingList.map((item: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-primary)] hover:bg-opacity-5 transition rounded-lg"
                    >
                      <input
                        type="checkbox"
                        // Changed text-green-500 to text-green-500/50 (50% opacity)
                        // Changed focus:ring-green-500 to focus:ring-green-500/50
                        className="w-5 h-5 rounded border-gray-400 text-green-900/50 focus:ring-green-900/50 bg-transparent cursor-pointer shrink-0"
                      />
                      <span className="text-[var(--color-text-secondary)] text-base md:text-lg ">
                        {item}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--color-text-secondary)] italic">
                    No items found in diet plan.
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(shoppingList.join("\n"))
                }
                className="w-full mt-6 md:mt-8 py-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-border)] rounded-xl text-sm font-medium transition-colors text-[var(--color-text)]"
              >
                Copy List to Clipboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Image Modal */}
      {imageModalData && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setImageModalData(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--color-card)] p-4 rounded-2xl w-full max-w-md md:max-w-lg border border-[var(--color-border)] shadow-2xl relative mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModalData(null)}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-black/50 rounded-full hover:bg-red-500/20 text-white transition z-10"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg md:text-xl font-bold mb-4 text-[var(--color-text)] pr-8">
              {imageModalData.type === "exercise"
                ? "Workout Demo"
                : "Meal Idea"}
            </h3>

            {generatingImage ? (
              <div className="h-48 md:h-64 flex flex-col items-center justify-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-blue-500"></div>
                <p className="text-[var(--color-text-secondary)] animate-pulse text-sm md:text-base">
                  Generating AI Image...
                </p>
              </div>
            ) : imageModalData.image ? (
              <div className="relative group">
                <img
                  src={imageModalData.image}
                  className="w-full rounded-xl shadow-lg"
                  alt="Generated"
                />
                <a
                  href={imageModalData.image}
                  download="fitness-ai-image.png"
                  className="absolute bottom-3 right-3 md:bottom-4 md:right-4 p-2 bg-black/70 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                >
                  <Download size={18} />
                </a>
              </div>
            ) : (
              <p className="p-6 md:p-8 text-center text-red-400 bg-red-500/10 rounded-xl text-sm">
                Failed to generate image. Please check API keys.
              </p>
            )}
          </motion.div>
        </div>
      )}
      {/* Medical Disclaimer Footer */}
      <div className="text-center mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[var(--color-border)] text-[10px] md:text-xs text-[var(--color-text-secondary)] px-4">
        <p>
          ⚠️ <strong>Disclaimer:</strong> This is an AI-generated plan. Please
          consult a healthcare professional before starting any new exercise or
          diet program.
        </p>
      </div>
      {/* Reset Button */}
      <button
        onClick={reset}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors text-xs md:text-sm w-full text-center mt-4 flex items-center justify-center gap-2 group pb-4"
      >
        <span>← Start Over</span>
      </button>
      {/* Toast Notification */}
      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  );
}
