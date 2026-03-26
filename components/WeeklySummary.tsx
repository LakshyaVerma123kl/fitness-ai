"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, TrendingUp, Calendar, Dumbbell, Scale, ChevronRight } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface SummaryData {
  summary: string;
  stats: {
    workoutsCompleted: number;
    totalDays: number;
    weightChange: string | null;
    exercisesLogged: number;
  };
}

const MOTIVATIONAL_QUOTES = [
  "Every rep is a conversation with your future self.",
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Progress, not perfection.",
  "Train hard, recover harder.",
  "The pain you feel today will be the strength you feel tomorrow.",
];

export default function WeeklySummary({ userGoal }: { userGoal?: string }) {
  const { user } = useUser();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [quoteIdx] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash += today.charCodeAt(i);
    return hash % MOTIVATIONAL_QUOTES.length;
  });

  // Auto-load on mount
  useEffect(() => {
    if (user) fetchSummary(false);
  }, [user]);

  const fetchSummary = async (forceRefresh = false) => {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `weekly_summary_${user?.id}_${today}`;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setSummaryData(JSON.parse(cached));
        setLoaded(true);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user?.firstName || "Athlete",
          userGoal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummaryData(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setLoaded(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const dayOfWeek = new Date().toLocaleDateString("en", { weekday: "long" });

  return (
    <div className="w-full space-y-4">
      {/* Quote of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 rounded-2xl border border-[var(--color-border)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Sparkles size={12} /> Quote of the Day
          </p>
          <p className="text-base font-semibold text-[var(--color-text)] italic leading-relaxed">
            "{MOTIVATIONAL_QUOTES[quoteIdx]}"
          </p>
        </div>
      </motion.div>

      {/* Weekly AI Summary */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl translate-y-8 -translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Weekly AI Coaching Summary
            </h3>
            <button
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="p-2 rounded-full hover:bg-white/5 transition text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] shrink-0"
              title="Force refresh summary"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-4 animate-pulse rounded bg-white/5 ${i === 3 ? "w-2/3" : "w-full"}`} />
                ))}
              </motion.div>
            )}

            {!loading && summaryData && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {summaryData.summary}
                </p>

                {/* Mini Stats Row */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                      <Dumbbell size={14} />
                    </div>
                    <p className="text-lg font-black text-[var(--color-text)]">{summaryData.stats.workoutsCompleted}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">Workouts</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <TrendingUp size={14} />
                    </div>
                    <p className="text-lg font-black text-[var(--color-text)]">{summaryData.stats.exercisesLogged}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">Exercises</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                      <Scale size={14} />
                    </div>
                    <p className={`text-lg font-black ${summaryData.stats.weightChange && parseFloat(summaryData.stats.weightChange) < 0 ? "text-green-400" : "text-[var(--color-text)]"}`}>
                      {summaryData.stats.weightChange ? `${summaryData.stats.weightChange}kg` : "—"}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">Weight Δ</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!loading && !summaryData && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                <p className="text-sm text-[var(--color-text-secondary)]">Generating your weekly insights…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
