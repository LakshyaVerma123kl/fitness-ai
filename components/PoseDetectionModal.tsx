"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  CameraOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Activity,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  RefreshCw,
  Brain,
  Sparkles,
  Info,
} from "lucide-react";

import { ScoreRing, PoseScoreArea, PoseIssuesArea, PosePraisesArea, PoseJointsArea } from "./PoseDetectionUI";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
// Types now imported from utils/poseAnalysis.ts

import { 
  Keypoint, 
  AngleRule, 
  AlignmentRule, 
  ExerciseProfile, 
  RepState, 
  analyze,
} from "@/utils/poseAnalysis";
import { usePoseDetection, Stage, AngleMarker } from "@/utils/usePoseDetection";
import { resolveProfile, matchHardcoded } from "@/utils/poseAnalysis";

// ─────────────────────────────────────────────────────────────
// MoveNet keypoints
// ─────────────────────────────────────────────────────────────
const MOVENET_KPS = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
];

// Types now imported from utils/poseAnalysis.ts

// ─────────────────────────────────────────────────────────────
// Canvas drawing
// ─────────────────────────────────────────────────────────────
const CONNECTIONS: [string, string][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["nose", "left_eye"],
  ["nose", "right_eye"],
  ["left_eye", "left_ear"],
  ["right_eye", "right_ear"],
];

function drawFrame(
  canvas: HTMLCanvasElement,
  kps: Keypoint[],
  status: "good" | "warning" | "bad",
  markers: AngleMarker[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const col =
    status === "good"
      ? "#00e599"
      : status === "warning"
        ? "#fbbf24"
        : "#ef4444";
  const m: Record<string, Keypoint> = {};
  kps.forEach((k) => {
    if (k.name) m[k.name] = k;
  });

  ctx.shadowBlur = 8;
  ctx.shadowColor = col;
  CONNECTIONS.forEach(([a, b]) => {
    const pA = m[a],
      pB = m[b];
    if (!pA || !pB || (pA.score ?? 1) < 0.25 || (pB.score ?? 1) < 0.25) return;
    const conf = Math.min(pA.score ?? 1, pB.score ?? 1);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2 + conf * 2;
    ctx.globalAlpha = 0.55 + conf * 0.45;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  kps.forEach((k) => {
    if ((k.score ?? 1) < 0.25) return;
    ctx.globalAlpha = k.score ?? 1;
    ctx.beginPath();
    ctx.arc(k.x, k.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = `${col}33`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(k.x, k.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  markers.forEach((mk) => {
    ctx.font = "bold 11px monospace";
    const txt = `${mk.joint}: ${mk.angle}°`;
    const tw = ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.beginPath();
    ctx.roundRect(mk.x - 6, mk.y - 14, tw + 12, 18, 4);
    ctx.fill();
    ctx.strokeStyle = mk.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = mk.color;
    ctx.fillText(txt, mk.x, mk.y);
  });
  ctx.globalAlpha = 1;
}

function buildMarkers(
  kps: Keypoint[],
  profile: ExerciseProfile,
  angles: Record<string, number>,
): AngleMarker[] {
  const m: Record<string, Keypoint> = {};
  kps.forEach((k) => {
    if (k.name) m[k.name] = k;
  });
  return profile.angles
    .filter((r) => angles[r.name] != null && m[r.points[1]])
    .map((r) => {
      const v = m[r.points[1]];
      const angle = angles[r.name];
      const ok = angle >= r.goodRange[0] && angle <= r.goodRange[1];
      return {
        joint: r.name,
        angle,
        x: v.x + 12,
        y: v.y - 8,
        color: ok ? "#00e599" : "#ef4444",
      };
    });
}

// ─────────────────────────────────────────────────────────────
// Voice
// ─────────────────────────────────────────────────────────────
let lastSpokenIssue = "";
let lastRepSpoken = -1;
function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.1;
  u.pitch = 1;
  u.volume = 0.9;
  window.speechSynthesis.speak(u);
}

// Used from PoseDetectionUI.tsx

// ─────────────────────────────────────────────────────────────
// Source badge
// ─────────────────────────────────────────────────────────────
function SourceBadge({
  source,
  provider,
}: {
  source: "ai" | "hardcoded" | "fallback";
  provider: string;
}) {
  const configs = {
    ai: {
      icon: <Sparkles size={8} />,
      color: "bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20",
    },
    hardcoded: {
      icon: <Brain size={8} />,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    fallback: {
      icon: <Info size={8} />,
      color: "bg-white/8 text-gray-400 border-white/10",
    },
  };
  const { icon, color } = configs[source] ?? configs.fallback;
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${color}`}
    >
      {icon} {provider}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────
interface Props {
  exerciseName: string;
  onClose: () => void;
}

export default function PoseDetectionModal({ exerciseName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);

  const {
    stage,
    msg,
    errMsg,
    result,
    modelLabel,
    provider,
    fps,
    profile,
    pipeline,
    resetReps
  } = usePoseDetection(videoRef, canvasRef, resolveProfile, exerciseName, voiceOn);

  const isRepBased = profile?.isRepBased ?? true;
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

  const STEPS = [
    { key: "generating", label: "Resolving exercise profile" },
    { key: "loading-tf", label: "Loading TensorFlow.js" },
    { key: "loading-model", label: "Loading pose model" },
    { key: "loading-camera", label: "Starting camera" },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden max-h-[95vh] flex flex-col"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00e599] to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00e599]/10 rounded-lg shrink-0">
                <Activity size={16} className="text-[#00e599]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-[260px]">
                  {exerciseName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {modelLabel && (
                    <span className="text-[10px] text-gray-600 font-mono">
                      {modelLabel}
                    </span>
                  )}
                  {provider && profile && (
                    <SourceBadge source={profile.source} provider={provider} />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {stage === "ready" && (
                <>
                  <button
                    onClick={() => setVoiceOn((v) => !v)}
                    className={`p-2 rounded-lg transition ${voiceOn ? "bg-[#00e599]/10 text-[#00e599]" : "bg-white/5 text-gray-500"}`}
                  >
                    {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                  <button
                    onClick={() => setMirrored((m) => !m)}
                    className="p-2 hover:bg-white/8 rounded-lg transition text-gray-400 hover:text-white"
                  >
                    <RotateCcw size={15} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/8 rounded-lg transition text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Camera */}
            <div className="relative lg:w-[60%] bg-black aspect-video lg:aspect-auto flex items-center justify-center overflow-hidden shrink-0">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ transform: mirrored ? "scaleX(-1)" : "none" }}
              />

              {stage !== "ready" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-6">
                  {stage === "error" ? (
                    <>
                      <div className="p-3 bg-red-500/20 rounded-full">
                        <CameraOff size={28} className="text-red-400" />
                      </div>
                      <p className="text-red-300 text-sm text-center max-w-xs">
                        {errMsg}
                      </p>
                      <button
                        onClick={pipeline}
                        className="px-4 py-2 bg-[#00e599] text-black text-sm font-bold rounded-lg flex items-center gap-2"
                      >
                        <RefreshCw size={14} /> Retry
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-5 w-full max-w-xs">
                      {stage === "generating" ? (
                        <div className="p-3 bg-[#00e599]/10 rounded-full animate-pulse">
                          <Brain size={28} className="text-[#00e599]" />
                        </div>
                      ) : (
                        <Loader2
                          size={32}
                          className="animate-spin text-[#00e599]"
                        />
                      )}
                      <p className="text-white text-sm font-semibold text-center">
                        {msg}
                      </p>
                      <div className="w-full space-y-2">
                        {STEPS.map((step, i) => {
                          const ci = STEPS.findIndex((s) => s.key === stage);
                          return (
                            <div
                              key={step.key}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`w-3 h-3 rounded-full shrink-0 transition-colors ${i < ci ? "bg-[#00e599]" : i === ci ? "bg-[#00e599] animate-pulse" : "bg-white/10"}`}
                              />
                              <span
                                className={`text-xs ${i < ci ? "text-[#00e599]" : i === ci ? "text-white" : "text-gray-600"}`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-gray-600 text-center">
                        {matchHardcoded(exerciseName)
                          ? "Using optimised built-in analyzer"
                          : "First load ~10–15s"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {stage === "ready" && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                  <div className="px-2.5 py-1 bg-black/70 border border-[#00e599]/30 rounded-full text-[10px] text-[#00e599] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
                    LIVE · {fps} FPS
                  </div>
                  {isRepBased && (
                    <div className="px-2.5 py-1 bg-black/70 border border-purple-500/30 rounded-full text-[10px] text-purple-300 font-mono">
                      {result?.repCount ?? 0} REPS
                    </div>
                  )}
                  {profile?.cameraAngle && profile.cameraAngle !== "any" && (
                    <div className="px-2.5 py-1 bg-black/70 border border-white/10 rounded-full text-[10px] text-gray-400 font-mono">
                      📷 {profile.cameraAngle} view
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feedback panel */}
            <div className="lg:w-[40%] flex flex-col overflow-y-auto">
              <div className="p-4 sm:p-5 space-y-4 flex-1">
                {profile?.description && stage === "ready" && (
                  <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <Activity
                      size={11}
                      className="text-gray-500 mt-0.5 shrink-0"
                    />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>
                )}

                {!result ? (
                  <div className="flex flex-col items-center gap-3 text-center py-6">
                    <Camera size={26} className="text-gray-600" />
                    <p className="text-gray-500 text-sm">
                      Stand in frame to begin analysis
                    </p>
                    {profile && (
                      <div className="text-xs text-left w-full bg-white/4 border border-white/8 rounded-xl p-4 space-y-1.5">
                        <p className="text-gray-400 font-semibold mb-1">
                          Tracking {profile.angles.length} joint angles:
                        </p>
                        {profile.angles.map((a: any) => (
                          <p key={a.name} className="text-gray-600">
                            • {a.name} — good: {a.goodRange[0]}°–
                            {a.goodRange[1]}°
                          </p>
                        ))}
                        {profile.generalTips.length > 0 && (
                          <>
                            <p className="text-gray-400 font-semibold mt-2 mb-1">
                              Tips:
                            </p>
                            {profile.generalTips.map((t: string, i: number) => (
                              <p key={i} className="text-gray-600">
                                • {t}
                              </p>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <PoseScoreArea result={result} isRepBased={isRepBased} resetReps={resetReps} />
                    <PoseIssuesArea issues={result.issues} />
                    <PosePraisesArea praises={result.praises} />
                    <PoseJointsArea angles={result.angles} />

                    <p className="text-[10px] text-gray-700 text-center pt-1 border-t border-white/5">
                      AI analysis is a guide — always listen to your body
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
