"use client";
import { motion } from "framer-motion";
import {
  Heart,
  Droplets,
  Moon,
  AlertTriangle,
  Activity,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

export default function HealthView({ plan }: { plan: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid gap-6 lg:grid-cols-2 pb-10"
    >
      {/* Safety Warnings - Full Width */}
      {plan.safety_warnings && plan.safety_warnings.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-red-500/40 bg-red-500/5 lg:col-span-2">
          <h3 className="font-bold text-red-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <AlertTriangle size={24} /> Safety Warnings
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.safety_warnings.map((warning: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[var(--color-card)] p-4 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                <span className="text-red-500 font-bold text-xl leading-none mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <p className="text-sm font-medium text-[var(--color-text)] leading-relaxed">
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Considerations - Full Width */}
      {plan.health_considerations && (
        <div className="glass-card p-6 rounded-2xl border border-orange-500/30 bg-orange-500/5 lg:col-span-2">
          <h3 className="font-bold text-orange-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <Heart size={24} /> Medical Considerations
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            {/* Modifications Card */}
            <div className="bg-[var(--color-card)] p-5 rounded-xl border border-[var(--color-border)] flex flex-col h-full">
              <span className="text-xs font-bold text-orange-400 uppercase flex items-center gap-2 mb-3 tracking-wider">
                <Activity size={16} /> Modifications
              </span>
              <p className="text-[var(--color-text)] leading-relaxed">
                {plan.health_considerations.modifications || "None required"}
              </p>
            </div>

            {/* Monitoring Card */}
            <div className="bg-[var(--color-card)] p-5 rounded-xl border border-[var(--color-border)] flex flex-col h-full">
              <span className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2 mb-3 tracking-wider">
                <TrendingUp size={16} /> Monitoring
              </span>
              <p className="text-[var(--color-text)] leading-relaxed">
                {plan.health_considerations.monitoring || "Standard tracking"}
              </p>
            </div>

            {/* Red Flags Card */}
            <div className="bg-[var(--color-card)] p-5 rounded-xl border border-[var(--color-border)] flex flex-col h-full">
              <span className="text-xs font-bold text-red-400 uppercase flex items-center gap-2 mb-3 tracking-wider">
                <AlertTriangle size={16} /> Red Flags
              </span>
              <p className="text-[var(--color-text)] leading-relaxed">
                {plan.health_considerations.red_flags ||
                  "Pain, dizziness, shortness of breath"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hydration */}
      {plan.hydration && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] flex flex-col h-full">
          <h3 className="font-bold text-blue-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <Droplets size={24} /> Hydration
          </h3>
          <div className="space-y-5 flex-1">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Daily Target
              </span>
              <span className="font-black text-[var(--color-text)] text-2xl">
                {plan.hydration.target}
              </span>
            </div>

            {plan.hydration.timing && (
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <strong className="block text-xs text-blue-400 uppercase mb-2 font-bold">
                  Timing Strategy
                </strong>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {plan.hydration.timing}
                </p>
              </div>
            )}

            {plan.hydration.signs_of_dehydration && (
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)]">
                <strong className="block text-xs text-[var(--color-text-secondary)] uppercase mb-3 font-bold">
                  ⚠️ Signs of Dehydration
                </strong>
                <ul className="grid grid-cols-1 gap-2">
                  {plan.hydration.signs_of_dehydration.map(
                    (sign: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-[var(--color-text)] flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {sign}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recovery */}
      {plan.recovery && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] flex flex-col h-full">
          <h3 className="font-bold text-purple-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <Moon size={24} /> Recovery
          </h3>
          <div className="space-y-5 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] text-center">
                <span className="block text-xs text-[var(--color-text-secondary)] uppercase mb-1 font-bold">
                  Sleep Target
                </span>
                <span className="block font-black text-xl text-[var(--color-text)]">
                  {plan.recovery.sleep_target}
                </span>
              </div>
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] text-center">
                <span className="block text-xs text-[var(--color-text-secondary)] uppercase mb-1 font-bold">
                  Rest Days
                </span>
                <span className="block font-black text-xl text-[var(--color-text)]">
                  {plan.recovery.rest_days}
                </span>
              </div>
            </div>

            {plan.recovery.stress_management && (
              <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                <strong className="block text-xs text-purple-400 uppercase mb-2 font-bold">
                  Stress Management
                </strong>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {plan.recovery.stress_management}
                </p>
              </div>
            )}

            {plan.recovery.stretching && (
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)]">
                <strong className="block text-xs text-[var(--color-text-secondary)] uppercase mb-2 font-bold">
                  Stretching Routine
                </strong>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                  {plan.recovery.stretching}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Tracking - Full Width */}
      {plan.progress_tracking && (
        <div className="glass-card p-6 rounded-2xl border border-[var(--color-border)] lg:col-span-2">
          <h3 className="font-bold text-green-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <Activity size={24} /> Progress Markers
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Measurements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <div className="w-2 h-8 bg-green-500 rounded-full" />
                <strong className="text-[var(--color-text)] font-bold">
                  Measurements
                </strong>
              </div>
              <ul className="space-y-2">
                {plan.progress_tracking.measurements?.map(
                  (m: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2 pl-2"
                    >
                      <span className="text-green-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 block" />
                      <span className="leading-snug">{m}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Performance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                <strong className="text-[var(--color-text)] font-bold">
                  Performance
                </strong>
              </div>
              <ul className="space-y-2">
                {plan.progress_tracking.performance?.map(
                  (m: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2 pl-2"
                    >
                      <span className="text-blue-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 block" />
                      <span className="leading-snug">{m}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Health Metrics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
                <div className="w-2 h-8 bg-red-500 rounded-full" />
                <strong className="text-[var(--color-text)] font-bold">
                  Health Metrics
                </strong>
              </div>
              <ul className="space-y-2">
                {plan.progress_tracking.health_metrics?.map(
                  (m: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2 pl-2"
                    >
                      <span className="text-red-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 block" />
                      <span className="leading-snug">{m}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Coach Tips - Full Width */}
      {plan.tips && plan.tips.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 lg:col-span-2">
          <h3 className="font-bold text-yellow-400 flex items-center gap-3 mb-5 text-lg tracking-wide uppercase">
            <Lightbulb size={24} /> Coach's Tips
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {plan.tips.map((tip: string, i: number) => (
              <div
                key={i}
                className="flex gap-4 items-start bg-[var(--color-card)] p-4 rounded-xl border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--color-text)] leading-relaxed pt-1">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
