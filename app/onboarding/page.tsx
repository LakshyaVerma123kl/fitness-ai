"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Target, User, Dumbbell, ChevronRight, ChevronLeft,
  Zap, Apple, Activity, Check, Loader2, Sparkles
} from "lucide-react";

const GOALS = [
  { id: "Weight Loss", emoji: "🔥", label: "Lose Weight", description: "Burn fat, get lean" },
  { id: "Muscle Gain", emoji: "💪", label: "Build Muscle", description: "Get stronger & bigger" },
  { id: "Endurance", emoji: "🏃", label: "Boost Endurance", description: "Run further, last longer" },
  { id: "General Fitness", emoji: "✨", label: "Stay Healthy", description: "General wellbeing" },
  { id: "Athletic Performance", emoji: "⚡", label: "Peak Performance", description: "Train like an athlete" },
  { id: "Flexibility", emoji: "🧘", label: "Flexibility & Mobility", description: "Move better, feel better" },
];

const LEVELS = [
  { id: "Beginner", label: "Beginner", desc: "New to working out", emoji: "🌱" },
  { id: "Intermediate", label: "Intermediate", desc: "1-2 years of training", emoji: "🌿" },
  { id: "Advanced", label: "Advanced", desc: "3+ years, structured training", emoji: "🏆" },
];

const DIETS = [
  { id: "Standard", label: "No Restriction", emoji: "🍽️" },
  { id: "Vegetarian", label: "Vegetarian", emoji: "🥗" },
  { id: "Vegan", label: "Vegan", emoji: "🌱" },
  { id: "Keto", label: "Keto", emoji: "🥩" },
  { id: "Paleo", label: "Paleo", emoji: "🦴" },
  { id: "Mediterranean", label: "Mediterranean", emoji: "🫒" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    goal: "",
    level: "",
    diet: "",
    age: "",
    weight: "",
    height: "",
    gender: "Male",
    equipment: "Gym",
    activityLevel: "Moderately Active",
  });

  const STEPS = [
    {
      title: `Welcome, ${user?.firstName || "Athlete"}! 👋`,
      subtitle: "Let's build your perfect fitness plan in 3 quick steps.",
      icon: Sparkles,
    },
    {
      title: "What's your goal?",
      subtitle: "We'll tailor everything around what you want to achieve.",
      icon: Target,
    },
    {
      title: "Your experience & diet",
      subtitle: "Help us match the right intensity and nutrition.",
      icon: Activity,
    },
    {
      title: "Your body stats",
      subtitle: "Used to calculate your exact calorie targets and BMI.",
      icon: User,
    },
  ];

  const canProceed = () => {
    if (step === 1) return !!form.goal;
    if (step === 2) return !!form.level && !!form.diet;
    if (step === 3) return !!form.age && !!form.weight && !!form.height;
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.firstName || "Athlete",
          ...form,
          age: parseInt(form.age),
          weight: parseFloat(form.weight),
          height: parseFloat(form.height),
          sleepHours: 7,
          waterIntake: 2,
          stressLevel: "Moderate",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const planData = await res.json();

      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planData, userData: { ...form } }),
      });

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text)]">
            FITNESS<span className="text-[var(--color-primary)]">AI</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.slice(1).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--color-border)]">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: step > i ? "100%" : step === i + 1 ? "50%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="glass-card p-8 rounded-3xl border border-[var(--color-border)] shadow-2xl"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[var(--color-text)]">{STEPS[step].title}</h2>
              <p className="text-[var(--color-text-secondary)] mt-1 text-sm">{STEPS[step].subtitle}</p>
            </div>

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-6xl text-center py-4">🏋️</div>
                <p className="text-[var(--color-text-secondary)] text-sm text-center leading-relaxed">
                  In the next 60 seconds, we'll build you a <strong className="text-[var(--color-text)]">personalized AI fitness plan</strong> with custom workouts, meal plans, and calorie targets.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { icon: Dumbbell, label: "Custom Workouts" },
                    { icon: Apple, label: "Diet Plans" },
                    { icon: Zap, label: "Live AI Coach" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)]">
                      <Icon size={20} className="text-[var(--color-primary)]" />
                      <span className="text-xs text-[var(--color-text-secondary)] text-center">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Goal */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <motion.button
                    key={g.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm({ ...form, goal: g.id })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      form.goal === g.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.emoji}</div>
                    <p className="font-bold text-sm text-[var(--color-text)]">{g.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{g.description}</p>
                    {form.goal === g.id && (
                      <div className="mt-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <Check size={12} className="text-black" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 2: Level + Diet */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Experience Level</p>
                  <div className="grid grid-cols-3 gap-3">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setForm({ ...form, level: l.id })}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          form.level === l.id
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <div className="text-xl mb-1">{l.emoji}</div>
                        <p className="text-xs font-bold text-[var(--color-text)]">{l.label}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Diet Preference</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DIETS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setForm({ ...form, diet: d.id })}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          form.diet === d.id
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <div>{d.emoji}</div>
                        <div className="mt-0.5">{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Body Stats */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "age", label: "Age", placeholder: "25", unit: "yrs" },
                    { key: "weight", label: "Weight", placeholder: "70", unit: "kg" },
                    { key: "height", label: "Height", placeholder: "175", unit: "cm" },
                  ].map(({ key, label, placeholder, unit }) => (
                    <div key={key}>
                      <label className="text-xs text-[var(--color-text-secondary)] block mb-1">{label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full px-3 py-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)]">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {["Male", "Female", "Other"].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Equipment</label>
                    <select
                      value={form.equipment}
                      onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl bg-[var(--color-dark)] border border-[var(--color-border)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {["Gym", "Home (minimal)", "Bodyweight only", "Full Home Gym"].map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3.5 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm flex items-center gap-2 hover:bg-[var(--color-card)] transition"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < 3) setStep(step + 1);
              else handleGenerate();
            }}
            disabled={!canProceed() || generating}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-green-900/20"
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Building Your Plan…</>
            ) : step === 3 ? (
              <><Sparkles size={18} /> Generate My Plan</>
            ) : (
              <>Continue <ChevronRight size={18} /></>
            )}
          </button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition"
          >
            I already have a plan → Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
