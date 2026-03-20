"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, LayoutDashboard, Dumbbell, Brain, Scan, Play, Zap, Shield, BarChart3, Mic, ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import FitnessForm from "@/components/FitnessForm";
import PlanDisplay from "@/components/PlanDisplay";

// ── Feature card ────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, gradient, delay }: {
  icon: any; title: string; desc: string; gradient: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${gradient} opacity-80`}>
          <Icon size={22} className="text-white" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-text)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Floating orb background ─────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--color-primary)]/4 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/4 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-[40%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-purple-500/3 blur-3xl"
      />
    </div>
  );
}

const FEATURES = [
  { icon: Brain, title: "AI Plan Generation", desc: "Gemini-powered plans built around your body stats, goals, diet, injuries and activity level.", gradient: "bg-gradient-to-br from-[var(--color-primary)]/20 to-blue-500/20", delay: 0 },
  { icon: Scan, title: "Live Pose Detection", desc: "Your webcam watches your form in real-time. Get scored on every rep with AI-powered corrections.", gradient: "bg-gradient-to-br from-blue-500/20 to-purple-500/20", delay: 0.1 },
  { icon: Mic, title: "Voice AI Coach", desc: "Speak to your coach hands-free. Ask anything — form tips, diet help, motivation — while mid-workout.", gradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/20", delay: 0.2 },
  { icon: BarChart3, title: "Progress Heatmap", desc: "GitHub-style activity grid, body measurement trends, and personal records per exercise.", gradient: "bg-gradient-to-br from-orange-500/20 to-red-500/20", delay: 0.3 },
  { icon: Dumbbell, title: "Workout Logger", desc: "Log every set, rep, and weight. See per-exercise progress charts and personal record detection.", gradient: "bg-gradient-to-br from-green-500/20 to-teal-500/20", delay: 0.4 },
  { icon: Shield, title: "Medical-Safe Plans", desc: "Handles injuries, allergies, medications, and chronic conditions. Safety warnings built in.", gradient: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20", delay: 0.5 },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    setError("");
    setUserData(formData);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }
      const data = await res.json();
      if (!data.workout || !data.diet) throw new Error("Invalid plan structure received");
      setPlan(data);
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = (adaptive: boolean = false) => {
    if (!userData) return;
    setPlan(null);
    let nextUserData = { ...userData };
    if (adaptive) {
      if (userData.level === "Beginner") nextUserData.level = "Intermediate";
      else if (userData.level === "Intermediate") nextUserData.level = "Advanced";
    }
    setUserData(nextUserData);
    setTimeout(() => handleGenerate(nextUserData), 100);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center relative bg-[var(--color-dark)] text-[var(--color-text)] transition-colors duration-300 overflow-x-hidden">
      <FloatingOrbs />

      {/* Navbar */}
      <nav className="w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center z-50 sticky top-0 backdrop-blur-xl bg-[var(--color-dark)]/80 border-b border-[var(--color-border)]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-blue-500 flex items-center justify-center">
            <Dumbbell size={14} className="text-black" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter">
            FITNESS<span className="text-[var(--color-primary)]">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-[var(--color-card)] rounded-full transition border border-transparent hover:border-[var(--color-border)]" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="text-[var(--color-primary)]" size={18} /> : <Moon className="text-gray-600" size={18} />}
            </button>
          )}
          <SignedOut>
            <Link href="/sign-in"><button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:text-[var(--color-primary)] transition">Sign In</button></Link>
            <Link href="/sign-up"><button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black text-xs sm:text-sm font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/20">Get Started</button></Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="px-3 sm:px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-xs sm:text-sm font-medium hover:border-[var(--color-primary)] sm:mr-2 flex items-center gap-1 sm:gap-2 transition">
                <LayoutDashboard size={16} className="sm:inline" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border-2 border-[var(--color-primary)]" } }} />
          </SignedIn>
        </div>
      </nav>

      <div className="z-10 w-full max-w-6xl px-4">
        {plan ? (
          <div className="py-10">
            <PlanDisplay plan={plan} reset={() => { setPlan(null); setUserData(null); }} onRegenerate={handleRegenerate} userData={userData} />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="py-16 sm:py-24 text-center relative">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold tracking-wider mb-6"
              >
                <Zap size={12} /> POWERED BY GEMINI AI
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-none"
              >
                YOUR AI{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-blue-400 to-purple-500">
                  PERSONAL
                </span>
                <br />
                TRAINER
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Medical-safe AI fitness plans + real-time pose detection + voice coaching + body analytics.<br className="hidden sm:block" />
                <strong className="text-[var(--color-text)]">Everything a personal trainer does, free.</strong>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <SignedOut>
                  <Link href="/sign-up">
                    <button className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-black rounded-2xl hover:opacity-90 transition shadow-2xl shadow-green-500/30 text-base flex items-center gap-2 group">
                      Start Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link href="#generate">
                    <button className="px-8 py-4 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-bold rounded-2xl hover:border-[var(--color-primary)] transition text-base flex items-center gap-2">
                      <Play size={16} className="text-[var(--color-primary)]" /> Try Demo
                    </button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-black rounded-2xl hover:opacity-90 transition shadow-2xl shadow-green-500/30 text-base flex items-center gap-2 group">
                      Open Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </SignedIn>
              </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">
                  Not just a plan generator.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-blue-500">
                    A complete fitness ecosystem.
                  </span>
                </h2>
                <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                  Six features that most paid gym apps still don't have — all in one place, all free.
                </p>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
              </div>
            </section>

            {/* Generator Section */}
            <section id="generate" className="py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-2">
                  Generate your plan now
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  Free, personalized, ready in ~30 seconds.
                </p>
              </motion.div>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
                  ⚠️ {error}
                </div>
              )}
              <div className="w-full max-w-2xl mx-auto">
                <FitnessForm onSubmit={handleGenerate} isLoading={loading} />
              </div>
            </section>

            {/* CTA Banner */}
            <section className="py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-3xl p-10 text-center overflow-hidden border border-[var(--color-primary)]/30 bg-gradient-to-br from-[var(--color-primary)]/10 to-blue-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-blue-500/5" />
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">
                    Ready to transform?
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
                    Join thousands of athletes who replaced their expensive PT with FitnessAI.
                  </p>
                  <SignedOut>
                    <Link href="/sign-up">
                      <button className="px-10 py-4 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-black rounded-2xl hover:opacity-90 transition shadow-2xl shadow-green-500/30 text-lg flex items-center gap-2 mx-auto">
                        Start for Free <ArrowRight size={20} />
                      </button>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <button className="px-10 py-4 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-black font-black rounded-2xl hover:opacity-90 transition shadow-2xl shadow-green-500/30 text-lg flex items-center gap-2 mx-auto">
                        Go to Dashboard <ArrowRight size={20} />
                      </button>
                    </Link>
                  </SignedIn>
                </div>
              </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-blue-500 flex items-center justify-center">
                  <Dumbbell size={10} className="text-black" />
                </div>
                FITNESS<span className="text-[var(--color-primary)]">AI</span>
              </div>
              <p>© {new Date().getFullYear()} FitnessAI · AI-Powered Personal Training</p>
              <div className="flex gap-4">
                <Link href="/sign-in" className="hover:text-[var(--color-primary)] transition">Sign In</Link>
                <Link href="/sign-up" className="hover:text-[var(--color-primary)] transition">Sign Up</Link>
                <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition">Dashboard</Link>
              </div>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
