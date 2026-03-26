"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Zap, Medal, Star, Crown, ChevronRight } from "lucide-react";

interface PR {
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  total_sets: number;
  last_logged: string;
  is_new?: boolean;
}

// Calorie burn estimates per exercise type (kcal per set @ average intensity)
const CALORIE_MAP: Record<string, number> = {
  "push-up": 8, "pull-up": 10, "squat": 12, "deadlift": 15, "bench press": 14,
  "plank": 5, "lunge": 10, "shoulder press": 11, "bicep curl": 7, "tricep dip": 8,
  "burpee": 18, "mountain climber": 12, "jumping jack": 9, "hip thrust": 11, "row": 12,
};

function getCalorieEstimate(exerciseName: string, sets: number, reps: number, weight: number): number {
  const key = exerciseName.toLowerCase();
  const match = Object.keys(CALORIE_MAP).find((k) => key.includes(k));
  const base = match ? CALORIE_MAP[match] : 8;
  const weightMultiplier = weight > 0 ? 1 + (weight / 100) : 1;
  return Math.round(base * sets * (reps / 10) * weightMultiplier);
}

export { getCalorieEstimate };

export default function PersonalRecords() {
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalExercises: 0, totalSets: 0, totalVolume: 0 });

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/workout-log");
      const data = await res.json();
      const logs: any[] = data.logs || [];

      // Calculate PRs per exercise
      const exerciseMap: Record<string, PR> = {};
      let totalSets = 0;
      let totalVolume = 0;

      logs.forEach((log) => {
        const name = log.exercise_name;
        if (!exerciseMap[name]) {
          exerciseMap[name] = {
            exercise_name: name,
            max_weight: 0,
            max_reps: 0,
            total_sets: 0,
            last_logged: log.logged_at,
          };
        }
        const pr = exerciseMap[name];
        if (log.weight_kg && log.weight_kg > pr.max_weight) pr.max_weight = log.weight_kg;
        if (log.reps && log.reps > pr.max_reps) pr.max_reps = log.reps;
        pr.total_sets += log.sets || 1;
        if (log.logged_at > pr.last_logged) pr.last_logged = log.logged_at;
        totalSets += log.sets || 1;
        totalVolume += (log.sets || 1) * (log.reps || 1) * (log.weight_kg || 0);
      });

      const prList = Object.values(exerciseMap).sort(
        (a, b) => new Date(b.last_logged).getTime() - new Date(a.last_logged).getTime()
      );

      setPrs(prList);
      setStats({ totalExercises: prList.length, totalSets, totalVolume: Math.round(totalVolume) });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]" />
        ))}
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <div className="text-center py-12 glass-card rounded-2xl border border-[var(--color-border)]">
        <Trophy size={40} className="mx-auto text-yellow-400 opacity-40 mb-4" />
        <p className="text-[var(--color-text-secondary)]">No PRs yet — start logging workouts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lifetime Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Exercises Tracked", value: stats.totalExercises, icon: Zap, color: "text-blue-400" },
          { label: "Total Sets Done", value: stats.totalSets.toLocaleString(), icon: Medal, color: "text-orange-400" },
          { label: "Total Volume (kg)", value: stats.totalVolume > 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${stats.totalVolume}`, icon: Crown, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 rounded-2xl border border-[var(--color-border)] space-y-1">
            <s.icon size={16} className={s.color} />
            <p className="text-xl font-black text-[var(--color-text)]">{s.value}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* PR Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" /> Personal Records
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-1">
          {prs.map((pr, i) => (
            <motion.div
              key={pr.exercise_name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl glass-card border border-[var(--color-border)] group hover:border-yellow-500/30 transition-all gap-4 sm:gap-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-400" :
                  i === 2 ? "bg-orange-400/20 text-orange-400" :
                  "bg-white/5 text-[var(--color-text-secondary)]"
                }`}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--color-text)]">{pr.exercise_name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {new Date(pr.last_logged).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-3 text-right pt-2 border-t border-[var(--color-border)] sm:pt-0 sm:border-0">
                {pr.max_weight > 0 && (
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">{pr.max_weight}<span className="text-xs text-[var(--color-text-secondary)] ml-0.5">kg</span></p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">max weight</p>
                  </div>
                )}
                {pr.max_reps > 0 && (
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">{pr.max_reps}<span className="text-xs text-[var(--color-text-secondary)] ml-0.5">reps</span></p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">max reps</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-black text-[var(--color-primary)]">{pr.total_sets}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">sets total</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
