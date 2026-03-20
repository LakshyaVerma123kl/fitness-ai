"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Plus, ChevronDown, ChevronUp, Trophy, Clock,
  Weight, BarChart3, Save, Trash2, History, X, Check
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface WorkoutLog {
  id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  notes: string | null;
  pose_score: number | null;
  logged_at: string;
}

interface LogForm {
  exercise_name: string;
  sets: string;
  reps: string;
  weight_kg: string;
  duration_seconds: string;
  notes: string;
}

const QUICK_EXERCISES = [
  "Push-up", "Pull-up", "Squat", "Deadlift", "Bench Press",
  "Plank", "Lunge", "Shoulder Press", "Bicep Curl", "Tricep Dip",
  "Burpee", "Mountain Climber", "Jumping Jack", "Hip Thrust", "Row"
];

export default function WorkoutLogTracker() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState<LogForm>({
    exercise_name: "",
    sets: "",
    reps: "",
    weight_kg: "",
    duration_seconds: "",
    notes: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showForm]);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/workout-log");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.exercise_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workout-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_name: form.exercise_name.trim(),
          sets: form.sets ? parseInt(form.sets) : null,
          reps: form.reps ? parseInt(form.reps) : null,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setForm({ exercise_name: "", sets: "", reps: "", weight_kg: "", duration_seconds: "", notes: "" });
      setShowForm(false);
      await fetchLogs();
      showToast("✅ Exercise logged!");
    } catch {
      showToast("❌ Failed to log");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Group logs by exercise for history chart
  const exerciseHistory = selectedExercise
    ? logs
        .filter((l) => l.exercise_name === selectedExercise && l.weight_kg)
        .slice(0, 20)
        .reverse()
        .map((l) => ({
          date: new Date(l.logged_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
          weight: l.weight_kg,
          reps: l.reps,
        }))
    : [];

  // Unique exercises with latest entry
  const uniqueExercises = Array.from(new Set(logs.map((l) => l.exercise_name)));
  const todayLogs = logs.filter(
    (l) => new Date(l.logged_at).toDateString() === new Date().toDateString()
  );

  const totalVolumeToday = todayLogs.reduce((acc, l) => {
    return acc + ((l.sets || 0) * (l.reps || 0) * (l.weight_kg || 0));
  }, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Sets", value: todayLogs.reduce((a, l) => a + (l.sets || 1), 0), icon: Dumbbell, color: "text-[var(--color-primary)]" },
          { label: "Volume (kg)", value: totalVolumeToday ? `${totalVolumeToday.toLocaleString()}` : "—", icon: Weight, color: "text-blue-400" },
          { label: "Exercises Done", value: new Set(todayLogs.map((l) => l.exercise_name)).size, icon: Trophy, color: "text-yellow-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 rounded-2xl border border-[var(--color-border)] flex flex-col gap-1">
            <stat.icon size={18} className={stat.color} />
            <span className="text-2xl font-black text-[var(--color-text)]">{stat.value}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Log Exercise Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowForm(!showForm)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition"
      >
        {showForm ? <X size={20} /> : <Plus size={20} />}
        {showForm ? "Cancel" : "Log an Exercise"}
      </motion.button>

      {/* Log Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
              <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                <Dumbbell size={18} className="text-[var(--color-primary)]" /> New Exercise Entry
              </h3>

              {/* Quick picks */}
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">Quick Pick</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EXERCISES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setForm({ ...form, exercise_name: ex })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        form.exercise_name === ex
                          ? "bg-[var(--color-primary)] text-black border-transparent"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={inputRef}
                type="text"
                placeholder="Exercise name (e.g. Bench Press)"
                value={form.exercise_name}
                onChange={(e) => setForm({ ...form, exercise_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "sets", label: "Sets", placeholder: "3" },
                  { key: "reps", label: "Reps", placeholder: "10" },
                  { key: "weight_kg", label: "Weight (kg)", placeholder: "60" },
                  { key: "duration_seconds", label: "Duration (s)", placeholder: "60" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">{label}</label>
                    <input
                      type="number"
                      placeholder={placeholder}
                      value={form[key as keyof LogForm]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                ))}
              </div>

              <input
                type="text"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />

              <button
                onClick={handleSave}
                disabled={!form.exercise_name.trim() || saving}
                className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-pulse">Saving…</span>
                ) : (
                  <><Save size={16} /> Save Entry</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Progress Charts */}
      {uniqueExercises.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-400" /> Exercise Progress
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueExercises.map((ex) => (
              <button
                key={ex}
                onClick={() => setSelectedExercise(selectedExercise === ex ? null : ex)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  selectedExercise === ex
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-purple-500"
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedExercise && exerciseHistory.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="h-48"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseHistory}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, fill: "#a855f7" }} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            {selectedExercise && exerciseHistory.length <= 1 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                Log this exercise more times to see progress charts!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] space-y-3">
          <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
            <History size={18} className="text-blue-400" /> Recent Logs
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
            {logs.slice(0, 20).map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Dumbbell size={14} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{log.exercise_name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(log.logged_at).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {log.sets && <span>{log.sets} sets × </span>}
                    {log.reps && <span>{log.reps} reps</span>}
                    {log.weight_kg && <span> @ {log.weight_kg}kg</span>}
                    {log.pose_score && (
                      <span className="ml-1 text-[var(--color-primary)]">📐{log.pose_score}%</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]" />
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 z-[300] px-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl text-sm font-semibold text-[var(--color-text)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
