"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Scale,
  Zap,
  CheckCircle,
  Calendar,
  TrendingUp,
  Activity,
  Flame,
  Trophy,
  Medal,
  Award,
  Star,
  Share2,
  Download,
  X,
  Quote,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import html2canvas from "html2canvas";
import Toast from "./Toast";

interface ProgressEntry {
  date: string;
  weight: number | null;
  mood: string | null;
  workout_completed: boolean;
}

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
}

export default function ProgressTracker({
  userId,
  userGoal,
}: {
  userId: string;
  userGoal?: string;
}) {
  const { user } = useUser();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [todayEntry, setTodayEntry] = useState<ProgressEntry>({
    date: new Date().toISOString().split("T")[0],
    weight: null,
    mood: "",
    workout_completed: false,
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries);
        setStats(data.stats);

        const today = new Date().toISOString().split("T")[0];
        const existingToday = data.entries.find((e: any) => e.date === today);

        if (existingToday) {
          setTodayEntry(existingToday);
        }
      }
    } catch (error) {
      console.error("Failed to fetch progress", error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todayEntry),
      });

      if (res.ok) {
        setToast({
          show: true,
          message: "✅ Progress saved successfully!",
          type: "success",
        });
        fetchProgress();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      setToast({
        show: true,
        message: "❌ Failed to save progress",
        type: "error",
      });
    }
  };

  // Calculate Weight Change
  const weightChange = useMemo(() => {
    const weights = entries
      .filter((e) => e.weight)
      .map((e) => e.weight as number);
    if (weights.length < 2) return 0;
    return (weights[weights.length - 1] - weights[0]).toFixed(1);
  }, [entries]);

  // Chart Data logic
  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const entry = entries.find((e) => e.date === date);
      return {
        day: days[new Date(date).getDay()],
        completed: entry?.workout_completed ? 1 : 0,
        weight: entry?.weight || null,
      };
    });
  }, [entries]);

  // Download PNG Handler
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a", // Ensure dark background
        scale: 2, // Higher quality
      });
      const link = document.createElement("a");
      link.download = `fitness-progress-${new Date().toISOString()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setToast({
        show: true,
        message: "📸 Image downloaded!",
        type: "success",
      });
    } catch (err) {
      setToast({ show: true, message: "Failed to download", type: "error" });
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsapp = () => {
    const text = `🔥 Just hit a ${stats.currentStreak} day streak on FitnessAI! \n💪 Goal: ${userGoal} \n📉 Weight Change: ${weightChange}kg \n\nJoin me!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const badges = [
    { days: 3, icon: Medal, label: "3 Day Streak", color: "text-orange-400" },
    { days: 7, icon: Trophy, label: "7 Day Streak", color: "text-gray-300" },
    { days: 14, icon: Award, label: "14 Day Streak", color: "text-yellow-400" },
    { days: 30, icon: Star, label: "Legend", color: "text-purple-400" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* 🔥 STREAK DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={80} className="text-orange-500" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Current Streak
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-black text-[var(--color-text)]">
              {stats.currentStreak}
            </span>
            <span className="text-sm font-medium text-orange-500">days</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            {stats.currentStreak > 0
              ? "Keep the fire burning! 🔥"
              : "Start your streak today!"}
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={80} className="text-yellow-500" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Best Streak
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-black text-[var(--color-text)]">
              {stats.longestStreak}
            </span>
            <span className="text-sm font-medium text-yellow-500">days</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Your personal record 🏆
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Badges
            </h3>
            <button
              onClick={() => setShowShareModal(true)}
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
              title="Share Progress"
            >
              <Share2 size={20} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            {badges.map((badge) => {
              const isUnlocked = stats.longestStreak >= badge.days;
              return (
                <div
                  key={badge.days}
                  className="flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className={`p-3 rounded-full border transition-all ${
                      isUnlocked
                        ? `bg-white/5 border-[var(--color-border)] ${badge.color}`
                        : "bg-black/20 border-transparent text-gray-700 grayscale opacity-50"
                    }`}
                  >
                    <badge.icon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {badge.days} Days
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Activity className="text-blue-500" /> Daily Check-in
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Workout Completion */}
          <div
            onClick={() =>
              setTodayEntry({
                ...todayEntry,
                workout_completed: !todayEntry.workout_completed,
              })
            }
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 ${
              todayEntry.workout_completed
                ? "bg-green-500/10 border-green-500 text-green-500"
                : "bg-[var(--color-card)] border-[var(--color-border)] hover:border-gray-400 text-gray-400"
            }`}
          >
            <CheckCircle
              size={32}
              className={
                todayEntry.workout_completed ? "fill-green-500 text-white" : ""
              }
            />
            <span className="font-bold">
              {todayEntry.workout_completed
                ? "Workout Completed!"
                : "Mark as Done"}
            </span>
          </div>

          {/* Weight Input */}
          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col gap-2">
            <label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
              <Scale size={16} /> Current Weight (kg)
            </label>
            <input
              type="number"
              value={todayEntry.weight || ""}
              onChange={(e) =>
                setTodayEntry({
                  ...todayEntry,
                  weight: parseFloat(e.target.value),
                })
              }
              placeholder="0.0"
              className="bg-transparent text-3xl font-black text-[var(--color-text)] focus:outline-none w-full border-b border-[var(--color-border)] pb-1 placeholder-gray-700"
            />
          </div>

          {/* Mood Selector */}
          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col gap-2">
            <label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
              <Zap size={16} /> How do you feel?
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {["Great", "Good", "Tired", "Sore"].map((mood) => (
                <button
                  key={mood}
                  onClick={() => setTodayEntry({ ...todayEntry, mood })}
                  className={`p-2 rounded-lg transition-all text-xs font-bold border ${
                    todayEntry.mood === mood
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-[var(--color-dark)] text-[var(--color-text-secondary)] border-transparent hover:border-gray-600"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-6 py-4 bg-[var(--color-primary)] text-black font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-lg shadow-green-900/20"
        >
          Save Daily Progress
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" /> Weekly
            Consistency
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="completed"
                  fill="#00e599"
                  radius={[4, 4, 0, 0]}
                  name="Workouts"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Weight Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={entries.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-card)] p-6 rounded-2xl w-full max-w-md border border-[var(--color-border)] relative shadow-2xl">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            >
              <X size={20} className="text-white" />
            </button>

            <h3 className="text-xl font-bold text-[var(--color-text)] mb-6 text-center">
              Share Your Progress
            </h3>

            {/* THE CARD TO CAPTURE */}
            <div
              ref={cardRef}
              className="glass-card p-6 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden mb-6"
              style={{ minHeight: "400px" }}
            >
              {/* Background Glows */}
              <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-[var(--color-primary)]/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[-20%] w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
                        FitnessAI Journey
                      </h4>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {user?.firstName || "Athlete"}
                      </h2>
                    </div>
                    <div className="p-2 bg-[var(--color-primary)]/20 rounded-lg">
                      <Activity
                        size={24}
                        className="text-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-300 text-sm">
                        🔥 Current Streak
                      </span>
                      <span className="text-xl font-bold text-orange-500">
                        {stats.currentStreak} Days
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-300 text-sm">
                        ⚖️ Weight Change
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          Number(weightChange) <= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {weightChange} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-300 text-sm">
                        🎯 Current Goal
                      </span>
                      <span className="text-sm font-bold text-blue-400 capitalize">
                        {userGoal || "Get Fit"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex gap-3 items-start">
                    <Quote
                      size={16}
                      className="text-[var(--color-primary)] shrink-0 mt-1"
                    />
                    <p className="text-xs text-gray-400 italic">
                      "Consistency is what transforms average into excellence."
                    </p>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-[10px] text-gray-500">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-xs font-bold text-[var(--color-primary)]">
                      FITNESS<span className="text-white">AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadImage}
                className="flex-1 py-3 bg-[var(--color-primary)] text-black font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download
              </button>
              <button
                onClick={handleShareWhatsapp}
                className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

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
