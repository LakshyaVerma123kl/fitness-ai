"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Play, CheckCircle2, ChevronRight, Flame,
  Timer, Trophy, Zap, AlertCircle, X
} from "lucide-react";
import dynamic from "next/dynamic";

const WorkoutTimer = dynamic(() => import("./WorkoutTimer"), { ssr: false });

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  calories?: string;
  modification?: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  duration: string;
  intensity?: string;
  exercises: Exercise[];
  notes?: string;
}

export default function TodaysWorkout({ plan }: { plan: any }) {
  const [completedExs, setCompletedExs] = useState<Set<string>>(new Set());
  const [activeTimer, setActiveTimer] = useState<Exercise | null>(null);
  const [logging, setLogging] = useState<string | null>(null);
  const [loggedToast, setLoggedToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!plan?.workout || !Array.isArray(plan.workout)) return null;

  // Pick today's workout day (cycle through plan)
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  const workoutDays = plan.workout.filter((d: WorkoutDay) =>
    !d.day?.toLowerCase().includes("rest")
  );
  if (workoutDays.length === 0) return null;

  const todayWorkout: WorkoutDay = workoutDays[dayOfWeek % workoutDays.length];
  const totalExercises = todayWorkout.exercises?.length || 0;
  const completedCount = todayWorkout.exercises?.filter((ex: Exercise) =>
    completedExs.has(ex.name)
  ).length || 0;
  const progressPct = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const handleComplete = async (ex: Exercise) => {
    setCompletedExs((prev) => {
      const next = new Set(prev);
      if (next.has(ex.name)) next.delete(ex.name);
      else next.add(ex.name);
      return next;
    });

    // Auto-log to workout log
    if (!completedExs.has(ex.name)) {
      setLogging(ex.name);
      try {
        await fetch("/api/workout-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise_name: ex.name,
            sets: parseInt(ex.sets) || null,
            reps: parseInt(ex.reps) || null,
            notes: `From AI Plan: ${todayWorkout.focus}`,
          }),
        });
        setLoggedToast(`✅ ${ex.name} logged!`);
        setTimeout(() => setLoggedToast(null), 2000);
      } catch (e) {
        console.error(e);
      } finally {
        setLogging(null);
      }
    }
  };

  return (
    <div className="relative">
      <motion.div
        className="glass-card rounded-2xl border border-[var(--color-border)] overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Progress bar accent */}
        <div className="h-1 bg-[var(--color-border)]">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                  <Zap size={12} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">Today's Workout</span>
              </div>
              <h3 className="text-lg font-black text-[var(--color-text)]">{todayWorkout.focus}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-[var(--color-text-secondary)]">⏱ {todayWorkout.duration}</span>
                {todayWorkout.intensity && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    todayWorkout.intensity === "High" ? "bg-red-500/20 text-red-400" :
                    todayWorkout.intensity === "Moderate" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>{todayWorkout.intensity} Intensity</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-2xl font-black text-[var(--color-text)]">
                {completedCount}<span className="text-lg text-[var(--color-text-secondary)]">/{totalExercises}</span>
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)]">exercises done</span>
            </div>
          </div>

          {/* Exercise list */}
          <AnimatePresence>
            {(expanded ? todayWorkout.exercises : todayWorkout.exercises?.slice(0, 3))?.map(
              (ex: Exercise, i: number) => {
                const done = completedExs.has(ex.name);
                const isLogging = logging === ex.name;
                return (
                  <motion.div
                    key={ex.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl mb-2 transition-all ${
                      done
                        ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
                        : "bg-[var(--color-dark)] border border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleComplete(ex)}
                        disabled={isLogging}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                        }`}
                      >
                        {isLogging ? (
                          <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : done ? (
                          <CheckCircle2 size={14} className="text-black" />
                        ) : null}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${done ? "text-[var(--color-text-secondary)] line-through" : "text-[var(--color-text)]"}`}>
                          {ex.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {ex.sets} × {ex.reps} · {ex.rest} rest
                          {ex.calories && <span className="text-orange-400 ml-1">· 🔥{ex.calories}kcal</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTimer(ex)}
                      className="ml-2 p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition shrink-0"
                      title="Start timer"
                    >
                      <Timer size={14} />
                    </button>
                  </motion.div>
                );
              }
            )}
          </AnimatePresence>

          {totalExercises > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs text-[var(--color-primary)] hover:underline mt-1 flex items-center justify-center gap-1"
            >
              {expanded ? "Show less" : `Show ${totalExercises - 3} more exercises`}
              <ChevronRight size={12} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
          )}

          {/* Complete all button */}
          {completedCount === totalExercises && totalExercises > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-center p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
            >
              <p className="text-lg font-black text-[var(--color-primary)]">🎉 Workout Complete!</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">All exercises logged automatically</p>
            </motion.div>
          )}

          {/* Note */}
          {todayWorkout.notes && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-3 italic flex items-start gap-1.5">
              <AlertCircle size={11} className="mt-0.5 shrink-0 text-yellow-500" /> {todayWorkout.notes}
            </p>
          )}
        </div>
      </motion.div>

      {/* Timer modal */}
      {activeTimer && (
        <WorkoutTimer
          exerciseName={activeTimer.name}
          sets={parseInt(activeTimer.sets) || 3}
          reps={activeTimer.reps}
          rest={activeTimer.rest}
          onClose={() => setActiveTimer(null)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {loggedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-xl bg-[var(--color-primary)] text-black text-sm font-bold shadow-xl"
          >
            {loggedToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
