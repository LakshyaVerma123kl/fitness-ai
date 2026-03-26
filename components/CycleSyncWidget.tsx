"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Activity, AlertCircle, RefreshCw, ChevronDown, Moon } from "lucide-react";

const PHASES = [
  {
    id: "menstrual",
    label: "Menstrual Phase (Days 1-5)",
    icon: Moon,
    color: "text-indigo-400",
    bg: "from-indigo-500/20 to-purple-500/10",
    border: "border-indigo-500/30",
    workout: "Energy is typically lowest. Focus on light movement like yoga, walking, or stretching. If weightlifting, reduce volume by 20-30%.",
    nutrition: "Increase iron and magnesium intake (spinach, dark chocolate, red meat) to replenish what is lost and manage cramps.",
    emotion: "Be kind to yourself. It is completely okay to take an extra rest day."
  },
  {
    id: "follicular",
    label: "Follicular Phase (Days 6-14)",
    icon: Activity,
    color: "text-blue-400",
    bg: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/30",
    workout: "Energy is rising! This is the perfect time to push heavier weights, learn complex movements, and do higher-intensity cardio.",
    nutrition: "Focus on lean proteins, complex carbs, and fermented foods to support rising estrogen levels.",
    emotion: "You are biologically primed for high focus and energy."
  },
  {
    id: "ovulation",
    label: "Ovulation Phase (Days 15-17)",
    icon: Heart,
    color: "text-pink-400",
    bg: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/30",
    workout: "Peak strength! Your body is ready for Personal Records (PRs) and high-intensity interval training (HIIT).",
    nutrition: "Support your peak energy with plenty of antioxidant-rich berries, cruciferous vegetables, and clean protein.",
    emotion: "Estrogen is at its peak. You likely feel your most confident and strongest right now!"
  },
  {
    id: "luteal",
    label: "Luteal Phase (Days 18-28)",
    icon: RefreshCw,
    color: "text-orange-400",
    bg: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/30",
    workout: "Energy naturally drops as progesterone rises. Transition from heavy lifting to moderate weights. Avoid extremely taxing HIIT.",
    nutrition: "Cravings are normal! Focus on healthy fats (avocados, nuts) and slow-digesting carbs (sweet potatoes) to stabilize blood sugar.",
    emotion: "Your body is preparing for rest. Listen to your body and prioritize sleep and recovery."
  }
];

export default function CycleSyncWidget() {
  const [mounted, setMounted] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cycle_phase");
    if (saved && PHASES.find(p => p.id === saved)) {
      setActivePhaseId(saved);
    }
  }, []);

  if (!mounted) return null;

  const activePhase = PHASES.find(p => p.id === activePhaseId);

  const handleSelectPhase = (id: string) => {
    if (activePhaseId === id) {
      setActivePhaseId(null);
      localStorage.removeItem("cycle_phase");
    } else {
      setActivePhaseId(id);
      localStorage.setItem("cycle_phase", id);
      setExpanded(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="glass-card rounded-2xl border border-[var(--color-border)] overflow-hidden">
        
        {/* Header Toggle */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-[var(--color-card)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <Heart size={18} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                Cycle-Sync Insights
                {!activePhase && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Optional</span>}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {activePhase ? "Your plan is optimized for your current phase." : "Tailor your AI advice to your hormonal cycle phase."}
              </p>
            </div>
          </div>
          <ChevronDown size={20} className={`text-[var(--color-text-secondary)] transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--color-border)] bg-black/5 dark:bg-black/20"
            >
              <div className="p-4 md:p-5">
                <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-secondary)] mb-3">Select your current phase</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {PHASES.map((phase) => (
                    <button
                      key={phase.id}
                      onClick={() => handleSelectPhase(phase.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                        activePhaseId === phase.id
                          ? `bg-gradient-to-br ${phase.bg} ${phase.border}`
                          : "bg-[var(--color-card)] border-[var(--color-border)] hover:border-pink-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <phase.icon size={16} className={phase.color} />
                        {activePhaseId === phase.id && <div className="w-2 h-2 rounded-full bg-current mix-blend-screen" />}
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text)]">{phase.label.split("(")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Phase Display */}
        {activePhase && !expanded && (
          <div className="p-4 md:p-5 border-t border-[var(--color-border)]">
            <div className={`p-4 md:p-5 rounded-xl border ${activePhase.border} bg-gradient-to-br ${activePhase.bg} flex flex-col md:flex-row gap-4 md:gap-6`}>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <activePhase.icon size={16} className={activePhase.color} />
                  <span className={`text-xs font-black uppercase tracking-wider ${activePhase.color}`}>
                    {activePhase.label}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5"><Activity size={12}/> Workout Adjustment</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{activePhase.workout}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5"><Heart size={12}/> Nutrition Focus</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{activePhase.nutrition}</p>
                </div>

                <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 mt-2">
                  <p className={`text-sm italic flex items-start gap-2 ${activePhase.color}`}>
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {activePhase.emotion}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setExpanded(true)}
              className="mt-3 text-[10px] uppercase font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Change Phase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
