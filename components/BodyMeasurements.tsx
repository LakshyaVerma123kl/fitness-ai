"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, Plus, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Save, X
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

interface Measurement {
  id: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  neck: number | null;
  notes: string | null;
  measured_at: string;
}

const MEASUREMENT_FIELDS = [
  { key: "chest", label: "Chest", emoji: "💪" },
  { key: "waist", label: "Waist", emoji: "⬛" },
  { key: "hips", label: "Hips", emoji: "🔵" },
  { key: "left_arm", label: "Left Arm", emoji: "💪" },
  { key: "right_arm", label: "Right Arm", emoji: "💪" },
  { key: "left_thigh", label: "Left Thigh", emoji: "🦵" },
  { key: "right_thigh", label: "Right Thigh", emoji: "🦵" },
  { key: "neck", label: "Neck", emoji: "🔘" },
] as const;

export default function BodyMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("waist");
  const [form, setForm] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchMeasurements(); }, []);

  const fetchMeasurements = async () => {
    try {
      const res = await fetch("/api/measurements");
      const data = await res.json();
      setMeasurements(data.measurements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const hasValues = Object.values(form).some((v) => v.trim() !== "");
    if (!hasValues) return;
    setSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      MEASUREMENT_FIELDS.forEach(({ key }) => {
        payload[key] = form[key] ? parseFloat(form[key]) : null;
      });

      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setForm({});
      setShowForm(false);
      await fetchMeasurements();
      setToast("✅ Measurements saved!");
    } catch {
      setToast("❌ Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  // Radar chart data from latest measurement
  const radarData = MEASUREMENT_FIELDS
    .filter(({ key }) => latest?.[key as keyof Measurement])
    .map(({ key, label }) => ({
      metric: label,
      value: latest?.[key as keyof Measurement] as number || 0,
    }));

  // Line chart data for selected metric
  const lineData = measurements
    .filter((m) => m[selectedMetric as keyof Measurement])
    .map((m) => ({
      date: new Date(m.measured_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: m[selectedMetric as keyof Measurement] as number,
    }));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <Ruler className="text-purple-400" size={22} /> Body Measurements
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-600 transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Log Measurements"}
        </button>
      </div>

      {/* Input Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 rounded-2xl border border-purple-500/30 space-y-4">
              <h3 className="font-bold text-[var(--color-text)] text-sm uppercase tracking-wider">
                Today's Measurements (cm)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MEASUREMENT_FIELDS.map(({ key, label, emoji }) => (
                  <div key={key}>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">
                      {emoji} {label}
                    </label>
                    <input
                      type="number"
                      placeholder="cm"
                      value={form[key] || ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : <><Save size={16} /> Save Measurements</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest vs Previous Comparison */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MEASUREMENT_FIELDS.filter(({ key }) => latest[key as keyof Measurement]).map(({ key, label }) => {
            const current = latest[key as keyof Measurement] as number;
            const prev = previous?.[key as keyof Measurement] as number | null;
            const diff = prev ? ((current - prev)).toFixed(1) : null;
            const improved = diff ? parseFloat(diff) < 0 : null;

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-4 rounded-xl border border-[var(--color-border)] cursor-pointer"
                onClick={() => setSelectedMetric(key)}
              >
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
                <p className="text-xl font-black text-[var(--color-text)]">{current}
                  <span className="text-xs font-normal text-[var(--color-text-secondary)] ml-1">cm</span>
                </p>
                {diff && (
                  <div className={`flex items-center gap-1 text-xs mt-1 font-semibold ${improved ? "text-green-400" : "text-red-400"}`}>
                    {improved ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {diff}cm
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {measurements.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar */}
          {radarData.length >= 3 && (
            <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Body Profile</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Radar name="Body" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Line for selected metric */}
          {lineData.length >= 2 && (
            <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  {MEASUREMENT_FIELDS.find((f) => f.key === selectedMetric)?.label} Trend
                </h3>
                <span className="text-xs text-purple-400">(click a metric above)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: "#a855f7" }} name="cm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && measurements.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl border border-[var(--color-border)]">
          <Ruler size={40} className="mx-auto text-purple-400 opacity-50 mb-4" />
          <p className="text-[var(--color-text-secondary)]">No measurements logged yet.</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Track your body composition over time!</p>
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
