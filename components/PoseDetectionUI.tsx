import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Trophy, RefreshCw, Zap } from "lucide-react";

export function ScoreRing({ score }: { score: number }) {
  const r = 38,
    c = 2 * Math.PI * r,
    dash = (score / 100) * c;
  const col = score >= 75 ? "#00e599" : score >= 50 ? "#fbbf24" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="8"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl font-black text-white leading-none">
          {score}
        </span>
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          score
        </span>
      </div>
    </div>
  );
}

export function PoseScoreArea({ result, isRepBased, resetReps }: any) {
    const statusColor =
      result?.status === "good"
        ? "text-[#00e599]"
        : result?.status === "warning"
          ? "text-yellow-400"
          : "text-red-400";
    const statusBg =
      result?.status === "good"
        ? "bg-[#00e599]/10 border-[#00e599]/30"
        : result?.status === "warning"
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-red-500/10 border-red-500/30";
          
    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${statusBg}`}>
            <ScoreRing score={result.overallScore} />
            <div className="flex-1 min-w-0">
                <p className={`text-lg font-black ${statusColor}`}>
                    {result.status === "good"
                    ? "Great Form!"
                    : result.status === "warning"
                        ? "Needs Work"
                        : "Fix Posture"}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                    {result.overallScore >= 75
                    ? "Keep this form"
                    : "Focus on cues below"}
                </p>
                {isRepBased && (
                    <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                        <Trophy size={12} className="text-yellow-400" />
                        <span className="text-sm font-black text-white">
                        {result.repCount}
                        </span>
                        <span className="text-[10px] text-gray-500">
                        reps
                        </span>
                    </div>
                    <button
                        onClick={resetReps}
                        className="p-1.5 hover:bg-white/8 rounded-lg transition text-gray-600 hover:text-white"
                        title="Reset reps"
                    >
                        <RefreshCw size={12} />
                    </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export function PoseIssuesArea({ issues }: { issues: string[] }) {
    if (!issues.length) return null;
    return (
        <div>
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle size={10} /> Fix These
        </p>
        <div className="space-y-1.5">
            {issues.map((issue, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2"
            >
                <span className="text-red-400 text-xs mt-0.5 shrink-0">
                ⚠
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">
                {issue}
                </p>
            </motion.div>
            ))}
        </div>
        </div>
    )
}

export function PosePraisesArea({ praises }: { praises: string[] }) {
    if (!praises.length) return null;
    return (
        <div>
        <p className="text-[10px] font-bold text-[#00e599] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CheckCircle size={10} /> Looking Good
        </p>
        <div className="space-y-1">
            {praises.map((p, i) => (
            <div
                key={i}
                className="flex items-start gap-2 bg-[#00e599]/6 border border-[#00e599]/15 rounded-lg px-3 py-2"
            >
                <span className="text-[#00e599] text-xs mt-0.5 shrink-0">
                ✓
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                {p}
                </p>
            </div>
            ))}
        </div>
        </div>
    )
}


export function PoseJointsArea({ angles }: { angles: Record<string, number> }) {
    if (Object.keys(angles).length === 0) return null;
    return (
        <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Zap size={10} /> Joint Angles
        </p>
        <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(angles).map(
            ([joint, angle]) => (
                <div
                key={joint}
                className="flex justify-between items-center bg-white/4 border border-white/8 rounded-lg px-2.5 py-1.5"
                >
                <span className="text-[10px] text-gray-500 truncate pr-1">
                    {joint}
                </span>
                <span className="text-xs font-bold text-white font-mono shrink-0">
                    {angle}°
                </span>
                </div>
            ),
            )}
        </div>
        </div>
    )
}
