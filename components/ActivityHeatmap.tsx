"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface DayData {
  date: string;
  completed: boolean;
  workout_completed?: boolean;
  weight?: number | null;
  mood?: string | null;
}

function getIntensityClass(completed: boolean): string {
  if (!completed) return "bg-[var(--color-border)] opacity-60";
  return "bg-[var(--color-primary)] shadow-[0_0_6px_rgba(0,229,153,0.5)]";
}

function getTooltip(day: DayData): string {
  if (!day.completed) return day.date;
  return `${day.date} ✅ Workout done${day.mood ? ` · ${day.mood}` : ""}`;
}

export default function ActivityHeatmap() {
  const [entries, setEntries] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build 52-week grid (364 days back + today)
  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get first Sunday going back 52 weeks
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 363);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const entryMap = new Map(entries.map((e) => [e.date, e]));

    const weeks: DayData[][] = [];
    const current = new Date(startDate);

    while (current <= today) {
      const week: DayData[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = current.toISOString().split("T")[0];
        const entry = entryMap.get(dateStr);
        week.push({
          date: dateStr,
          completed: entry?.workout_completed ?? false,
          workout_completed: entry?.workout_completed ?? false,
          weight: entry?.weight,
          mood: entry?.mood,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [entries]);

  const completedCount = entries.filter((e: any) => e.workout_completed).length;
  const last30Active = entries
    .filter((e: any) => {
      const d = new Date(e.date);
      const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && e.workout_completed;
    }).length;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Month labels: find first week of each month
  const monthLabels: { month: string; col: number }[] = [];
  grid.forEach((week, wi) => {
    const firstOfWeek = week[0];
    if (firstOfWeek) {
      const d = new Date(firstOfWeek.date);
      if (d.getDate() <= 7) {
        monthLabels.push({ month: MONTHS[d.getMonth()], col: wi });
      }
    }
  });

  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]" />;
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--color-primary)]" />
            Activity Heatmap
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {completedCount} workouts in the last year · {last30Active} this month
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>Less</span>
          {["opacity-20", "opacity-40", "opacity-70", ""].map((op, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm bg-[var(--color-primary)] ${op}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[680px]">
          {/* Month labels */}
          <div className="flex mb-1 pl-6">
            {monthLabels.map(({ month, col }) => (
              <div
                key={`${month}-${col}`}
                className="text-[10px] text-[var(--color-text-secondary)] absolute"
                style={{ left: `${col * 14 + 24}px`, position: "relative" }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-1">
              {["", "M", "", "W", "", "F", ""].map((d, i) => (
                <div key={i} className="w-3 h-3 text-[8px] text-[var(--color-text-secondary)] flex items-center justify-center">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.4 }}
                    onMouseEnter={(e) => setTooltip({ text: getTooltip(day), x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getIntensityClass(day.completed)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[500] px-2 py-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[10px] text-[var(--color-text)] shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Streak insight */}
      {completedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
          <Flame size={12} className="text-orange-400" />
          <span>
            You're in the top tier — keep that heat going! 🔥
          </span>
        </div>
      )}
    </div>
  );
}
