"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Flame, Activity, CheckCircle, Apple } from "lucide-react";
import Toast from "./Toast";

interface MacroEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function DailyMacroLogger() {
  const { isLoaded, user } = useUser();
  const [entry, setEntry] = useState<MacroEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" } | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchTodayMacros();
    }
  }, [isLoaded, user]);

  const fetchTodayMacros = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/macros?date=${today}`);
      const data = await res.json();
      
      if (res.ok && data.entries.length > 0) {
        setEntry(data.entries[0]);
      } else {
        setEntry({ date: today, calories: 0, protein: 0, carbs: 0, fats: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch macros", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry) return;
    try {
      const res = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        setToast({ show: true, message: "🍎 Macros saved successfully!", type: "success" });
      } else {
        throw new Error("Failed to save macros");
      }
    } catch (error) {
      setToast({ show: true, message: "❌ Failed to save macros", type: "error" });
    }
  };

  const handleChange = (field: keyof MacroEntry, value: string) => {
    if (!entry) return;
    setEntry({ ...entry, [field]: parseInt(value) || 0 });
  };

  if (loading || !entry) {
    return (
      <div className="w-full h-48 animate-pulse bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] flex items-center justify-center">
         <span className="text-[var(--color-text-secondary)]">Loading Macros...</span>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] w-full relative">
       <h2 className="text-xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Apple className="text-red-400" /> Daily Macro Log
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={40} className="text-orange-500" />
            </div>
            <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Calories (kcal)</label>
            <input
              type="number"
              value={entry.calories || ""}
              onChange={(e) => handleChange('calories', e.target.value)}
              className="bg-transparent text-2xl font-black text-[var(--color-text)] focus:outline-none w-full placeholder-gray-700"
              placeholder="0"
            />
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-pink-500/20 flex flex-col gap-2">
            <label className="text-xs text-pink-400 uppercase tracking-wider font-bold">Protein (g)</label>
            <input
              type="number"
              value={entry.protein || ""}
              onChange={(e) => handleChange('protein', e.target.value)}
              className="bg-transparent text-2xl font-black text-[var(--color-text)] focus:outline-none w-full placeholder-gray-700"
              placeholder="0"
            />
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-blue-500/20 flex flex-col gap-2">
            <label className="text-xs text-blue-400 uppercase tracking-wider font-bold">Carbs (g)</label>
            <input
              type="number"
              value={entry.carbs || ""}
              onChange={(e) => handleChange('carbs', e.target.value)}
              className="bg-transparent text-2xl font-black text-[var(--color-text)] focus:outline-none w-full placeholder-gray-700"
              placeholder="0"
            />
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-card)] border border-yellow-500/20 flex flex-col gap-2">
            <label className="text-xs text-yellow-400 uppercase tracking-wider font-bold">Fats (g)</label>
            <input
              type="number"
              value={entry.fats || ""}
              onChange={(e) => handleChange('fats', e.target.value)}
              className="bg-transparent text-2xl font-black text-[var(--color-text)] focus:outline-none w-full placeholder-gray-700"
              placeholder="0"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] font-bold rounded-xl hover:bg-[var(--color-primary)] hover:text-black transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} /> Save Macros
        </button>
        
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
