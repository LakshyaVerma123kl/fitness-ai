"use client";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Dumbbell,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  X,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanDisplay from "@/components/PlanDisplay";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPlans();
    }
  }, [isLoaded, user]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (Array.isArray(data)) setPlans(data);
    } catch (err) {
      console.error("Failed to load plans", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Loader2 className="animate-spin text-[#00e599]" size={48} />
      </div>
    );

  // If a plan is selected, show the full plan view
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        {/* Navbar */}
        <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-50">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            FITNESS<span className="text-[#00e599]">AI</span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedPlan(null)}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 flex items-center gap-2 transition"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-9 h-9 border-2 border-[#00e599]" },
              }}
            />
          </div>
        </nav>

        {/* Display the full plan */}
        <PlanDisplay
          plan={selectedPlan.plan_data}
          userData={selectedPlan.user_data}
          reset={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6 md:p-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Here is your fitness journey history.
          </p>
        </div>
        <UserButton
          appearance={{
            elements: { avatarBox: "w-12 h-12 border-2 border-[#00e599]" },
          }}
        />
      </div>

      {/* Action Bar */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
          <Calendar size={20} className="text-[#00e599]" /> Your Plans
        </h2>
        <Link href="/">
          <button className="px-4 py-2 bg-[#00e599] text-black rounded-lg font-bold hover:bg-[#00cc88] transition flex items-center gap-2">
            <Plus size={18} /> New Plan
          </button>
        </Link>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="animate-spin text-[#00e599]" size={48} />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-20 glass-card rounded-2xl border border-white/10">
            <Dumbbell size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No plans generated yet.</p>
            <Link
              href="/"
              className="text-[#00e599] hover:underline mt-2 inline-block"
            >
              Create your first plan →
            </Link>
          </div>
        ) : (
          plans.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan(item)}
              className="glass-card p-6 rounded-2xl hover:border-[#00e599]/50 transition group relative overflow-hidden cursor-pointer border border-white/10"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-[#00e599]/10 text-[#00e599] text-xs font-bold rounded-full uppercase">
                  {item.user_data.goal}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2 text-white">
                {item.user_data.gender}, {item.user_data.age}yo
              </h3>
              <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                "{item.plan_data.motivation_quote}"
              </p>

              <div className="flex items-center justify-between text-sm text-gray-400 border-t border-white/10 pt-4">
                <span>BMI: {item.bmi}</span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center text-white">
                  View <ChevronRight size={16} />
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
