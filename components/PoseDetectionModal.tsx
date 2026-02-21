"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

interface PostureResult {
  overallScore: number; // 0–100
  status: "good" | "warning" | "bad";
  issues: string[];
  praises: string[];
}

// ─────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────
function getAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function kp(keypoints: Keypoint[], name: string): Keypoint | null {
  const found = keypoints.find((k) => k.name === name);
  return found && (found.score ?? 1) > 0.3 ? found : null;
}

function midpoint(a: Keypoint, b: Keypoint): Keypoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ─────────────────────────────────────────────────────────────
// Exercise-specific posture analyzers
// ─────────────────────────────────────────────────────────────
type Analyzer = (kps: Keypoint[]) => PostureResult;

const ANALYZERS: Record<string, Analyzer> = {
  squat: (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lHip = kp(kps, "left_hip");
    const lKnee = kp(kps, "left_knee");
    const lAnkle = kp(kps, "left_ankle");
    const rHip = kp(kps, "right_hip");
    const rKnee = kp(kps, "right_knee");
    const rAnkle = kp(kps, "right_ankle");
    const lShoulder = kp(kps, "left_shoulder");
    const rShoulder = kp(kps, "right_shoulder");

    if (lHip && lKnee && lAnkle) {
      const kneeAngle = getAngle(lHip, lKnee, lAnkle);
      if (kneeAngle < 70) {
        issues.push("Knees too deep — stop at 90° for safety");
        score -= 25;
      } else if (kneeAngle > 160) {
        issues.push("Go lower — aim for parallel (90° knee angle)");
        score -= 20;
      } else if (kneeAngle >= 85 && kneeAngle <= 105) {
        praises.push("Perfect squat depth! ✓");
      }
    }

    if (lShoulder && rShoulder && lHip && rHip) {
      const shoulderMid = midpoint(lShoulder, rShoulder);
      const hipMid = midpoint(lHip, rHip);
      const tiltAngle = Math.abs(
        Math.atan2(hipMid.y - shoulderMid.y, hipMid.x - shoulderMid.x) *
          (180 / Math.PI),
      );
      if (tiltAngle < 70 || tiltAngle > 110) {
        issues.push("Keep your chest up — avoid leaning too far forward");
        score -= 20;
      } else {
        praises.push("Good torso position ✓");
      }
    }

    if (lKnee && lAnkle && rKnee && rAnkle) {
      if (lKnee.x < lAnkle.x - 20 || rKnee.x > rAnkle.x + 20) {
        issues.push("Knees caving in — push them out over your toes");
        score -= 15;
      } else {
        praises.push("Knees tracking well ✓");
      }
    }

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },

  "push-up": (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lShoulder = kp(kps, "left_shoulder");
    const lElbow = kp(kps, "left_elbow");
    const lWrist = kp(kps, "left_wrist");
    const lHip = kp(kps, "left_hip");
    const lKnee = kp(kps, "left_knee");

    if (lShoulder && lElbow && lWrist) {
      const elbowAngle = getAngle(lShoulder, lElbow, lWrist);
      if (elbowAngle < 70) {
        issues.push("Arms too bent — control the descent");
        score -= 15;
      } else if (elbowAngle > 160) {
        praises.push("Full extension at top ✓");
      } else if (elbowAngle >= 85 && elbowAngle <= 100) {
        praises.push("Perfect elbow angle at bottom ✓");
      }
    }

    if (lShoulder && lHip && lKnee) {
      const bodyAngle = getAngle(lShoulder, lHip, lKnee);
      if (bodyAngle < 160) {
        issues.push("Hips sagging — engage your core to stay straight");
        score -= 25;
      } else if (bodyAngle > 195) {
        issues.push("Hips too high — lower them for a straight body line");
        score -= 15;
      } else {
        praises.push("Body in a straight line ✓");
      }
    }

    if (lShoulder && lElbow) {
      if (lElbow.x > lShoulder.x + 30) {
        issues.push("Elbows flaring too wide — tuck them closer to your sides");
        score -= 20;
      } else {
        praises.push("Elbows in good position ✓");
      }
    }

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },

  plank: (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lShoulder = kp(kps, "left_shoulder");
    const lHip = kp(kps, "left_hip");
    const lAnkle = kp(kps, "left_ankle");
    const lElbow = kp(kps, "left_elbow");
    const rShoulder = kp(kps, "right_shoulder");

    if (lShoulder && lHip && lAnkle) {
      const bodyLineAngle = getAngle(lShoulder, lHip, lAnkle);
      if (bodyLineAngle < 155) {
        issues.push("Hips drooping — brace your core harder");
        score -= 30;
      } else if (bodyLineAngle > 200) {
        issues.push("Hips piking up — lower them for a straight line");
        score -= 20;
      } else {
        praises.push("Perfect plank alignment ✓");
      }
    }

    if (lShoulder && lElbow) {
      const vertDiff = Math.abs(lShoulder.y - lElbow.y);
      if (vertDiff > 40) {
        issues.push("Shoulders directly above elbows for stability");
        score -= 15;
      } else {
        praises.push("Good shoulder stack ✓");
      }
    }

    if (lShoulder && rShoulder) {
      const horizDiff = Math.abs(lShoulder.y - rShoulder.y);
      if (horizDiff > 25) {
        issues.push("Level your shoulders — don't rotate the torso");
        score -= 15;
      }
    }

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },

  deadlift: (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lShoulder = kp(kps, "left_shoulder");
    const lHip = kp(kps, "left_hip");
    const lKnee = kp(kps, "left_knee");
    const lAnkle = kp(kps, "left_ankle");

    if (lShoulder && lHip && lKnee) {
      const hipAngle = getAngle(lShoulder, lHip, lKnee);
      if (hipAngle < 80) {
        issues.push("Back rounding — hinge from the hips, keep spine neutral");
        score -= 30;
      } else {
        praises.push("Hip hinge looks solid ✓");
      }
    }

    if (lHip && lKnee && lAnkle) {
      const kneeAngle = getAngle(lHip, lKnee, lAnkle);
      if (kneeAngle < 140 && kneeAngle > 60) {
        praises.push("Knee bend is appropriate ✓");
      } else if (kneeAngle <= 60) {
        issues.push("Too much knee bend — this is a hip hinge, not a squat");
        score -= 20;
      }
    }

    if (lShoulder && lHip) {
      const backTilt =
        Math.atan2(lHip.y - lShoulder.y, lHip.x - lShoulder.x) *
        (180 / Math.PI);
      if (backTilt < 30) {
        issues.push("Stay closer to vertical — avoid excessive forward lean");
        score -= 15;
      }
    }

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },

  lunge: (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lHip = kp(kps, "left_hip");
    const lKnee = kp(kps, "left_knee");
    const lAnkle = kp(kps, "left_ankle");
    const lShoulder = kp(kps, "left_shoulder");

    if (lHip && lKnee && lAnkle) {
      const kneeAngle = getAngle(lHip, lKnee, lAnkle);
      if (kneeAngle < 75 || kneeAngle > 110) {
        issues.push("Front knee should be at ~90° in the lunge position");
        score -= 20;
      } else {
        praises.push("Front knee angle is perfect ✓");
      }

      if (lKnee.x > lAnkle.x + 20) {
        issues.push("Front knee is past your toes — step further forward");
        score -= 25;
      } else {
        praises.push("Knee not passing over toe ✓");
      }
    }

    if (lShoulder && lHip) {
      const torsoAngle =
        Math.atan2(lHip.y - lShoulder.y, lHip.x - lShoulder.x) *
        (180 / Math.PI);
      if (Math.abs(torsoAngle - 90) > 20) {
        issues.push("Keep your torso upright — avoid leaning forward");
        score -= 15;
      } else {
        praises.push("Torso upright ✓");
      }
    }

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },

  default: (kps) => {
    const issues: string[] = [];
    const praises: string[] = [];
    let score = 100;

    const lShoulder = kp(kps, "left_shoulder");
    const rShoulder = kp(kps, "right_shoulder");
    const lHip = kp(kps, "left_hip");
    const rHip = kp(kps, "right_hip");

    if (lShoulder && rShoulder) {
      const diff = Math.abs(lShoulder.y - rShoulder.y);
      if (diff > 30) {
        issues.push("Shoulders uneven — stand tall and level");
        score -= 20;
      } else {
        praises.push("Shoulders level ✓");
      }
    }

    if (lHip && rHip) {
      const diff = Math.abs(lHip.y - rHip.y);
      if (diff > 30) {
        issues.push("Hips tilted — distribute weight evenly");
        score -= 20;
      } else {
        praises.push("Hips balanced ✓");
      }
    }

    if (lShoulder && lHip && rShoulder && rHip) {
      const shoulderMid = midpoint(lShoulder, rShoulder);
      const hipMid = midpoint(lHip, rHip);
      const lean = Math.abs(shoulderMid.x - hipMid.x);
      if (lean > 40) {
        issues.push("Significant lateral lean detected — centre yourself");
        score -= 25;
      } else {
        praises.push("Good overall alignment ✓");
      }
    }

    if (issues.length === 0) praises.push("Posture looks great! Keep it up 💪");

    return {
      overallScore: Math.max(0, score),
      status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
      issues,
      praises,
    };
  },
};

function getAnalyzer(exerciseName: string): Analyzer {
  const name = exerciseName.toLowerCase();
  if (name.includes("squat")) return ANALYZERS.squat;
  if (name.includes("push")) return ANALYZERS["push-up"];
  if (name.includes("plank")) return ANALYZERS.plank;
  if (name.includes("deadlift")) return ANALYZERS.deadlift;
  if (name.includes("lunge")) return ANALYZERS.lunge;
  return ANALYZERS.default;
}

// ─────────────────────────────────────────────────────────────
// Skeleton connections to draw
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
];

// ─────────────────────────────────────────────────────────────
// Draw overlay on canvas
// ─────────────────────────────────────────────────────────────
function drawSkeleton(
  canvas: HTMLCanvasElement,
  keypoints: Keypoint[],
  status: "good" | "warning" | "bad",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const color =
    status === "good"
      ? "#00e599"
      : status === "warning"
        ? "#fbbf24"
        : "#ef4444";

  const kpMap: Record<string, Keypoint> = {};
  keypoints.forEach((k) => {
    if (k.name) kpMap[k.name] = k;
  });

  // Draw connections
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  CONNECTIONS.forEach(([a, b]) => {
    const ptA = kpMap[a];
    const ptB = kpMap[b];
    if (ptA && ptB && (ptA.score ?? 1) > 0.3 && (ptB.score ?? 1) > 0.3) {
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    }
  });

  // Draw keypoints
  keypoints.forEach((k) => {
    if ((k.score ?? 1) > 0.3) {
      ctx.beginPath();
      ctx.arc(k.x, k.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────
// Score ring component
// ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  const color = score >= 75 ? "#00e599" : score >= 50 ? "#fbbf24" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl font-black text-white leading-none">
          {score}
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          score
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────────────────────
interface Props {
  exerciseName: string;
  onClose: () => void;
}

type LoadState = "idle" | "loading-tf" | "loading-camera" | "ready" | "error";

export default function PoseDetectionModal({ exerciseName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [postureResult, setPostureResult] = useState<PostureResult | null>(
    null,
  );
  const [frameCount, setFrameCount] = useState(0);
  const [isMirrored, setIsMirrored] = useState(true);

  const analyzer = getAnalyzer(exerciseName);

  // ── Load TF + MoveNet + Camera ────────────────────────────
  const start = useCallback(async () => {
    setLoadState("loading-tf");
    setErrorMsg("");

    try {
      // Dynamic import to keep bundle light
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.setBackend("webgl");
      await tf.ready();

      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        },
      );
      detectorRef.current = detector;

      setLoadState("loading-camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setLoadState("ready");
      runDetection();
    } catch (err: any) {
      console.error("Pose detection error:", err);
      if (err.name === "NotAllowedError") {
        setErrorMsg(
          "Camera access denied. Please allow camera permissions and try again.",
        );
      } else if (err.message?.includes("backend")) {
        setErrorMsg("WebGL not available. Try a modern browser like Chrome.");
      } else {
        setErrorMsg(err.message || "Failed to start pose detection.");
      }
      setLoadState("error");
    }
  }, []);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const poses = await detector.estimatePoses(video);
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints as Keypoint[];
        const result = analyzer(keypoints);
        setPostureResult(result);
        drawSkeleton(canvas, keypoints, result.status);
        setFrameCount((c) => c + 1);
      }
    } catch (_) {
      // Silent frame error — continue
    }

    rafRef.current = requestAnimationFrame(runDetection);
  }, [analyzer]);

  // ── Cleanup ───────────────────────────────────────────────
  useEffect(() => {
    start();
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      detectorRef.current?.dispose?.();
    };
  }, [start]);

  const statusColor =
    postureResult?.status === "good"
      ? "text-[#00e599]"
      : postureResult?.status === "warning"
        ? "text-yellow-400"
        : "text-red-400";

  const statusBg =
    postureResult?.status === "good"
      ? "bg-[#00e599]/10 border-[#00e599]/30"
      : postureResult?.status === "warning"
        ? "bg-yellow-500/10 border-yellow-500/30"
        : "bg-red-500/10 border-red-500/30";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,229,153,0.1)]"
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e599] to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00e599]/10 rounded-lg">
                <Activity size={18} className="text-[#00e599]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Posture Check
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {exerciseName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMirrored((m) => !m)}
                className="p-2 hover:bg-white/8 rounded-lg transition text-gray-400 hover:text-white"
                title="Mirror camera"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/8 rounded-lg transition text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Camera Feed */}
            <div className="relative lg:w-[58%] bg-black aspect-video flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
              />

              {/* Overlay states */}
              {loadState !== "ready" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
                  {loadState === "error" ? (
                    <>
                      <div className="p-3 bg-red-500/20 rounded-full">
                        <CameraOff size={32} className="text-red-400" />
                      </div>
                      <p className="text-red-300 text-sm font-medium text-center max-w-xs px-4">
                        {errorMsg}
                      </p>
                      <button
                        onClick={start}
                        className="px-4 py-2 bg-[#00e599] text-black text-sm font-bold rounded-lg hover:bg-[#00cc88] transition"
                      >
                        Try Again
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2
                        size={36}
                        className="animate-spin text-[#00e599]"
                      />
                      <p className="text-gray-300 text-sm font-medium">
                        {loadState === "loading-tf"
                          ? "Loading AI model…"
                          : "Starting camera…"}
                      </p>
                      <p className="text-gray-600 text-xs">
                        First load takes ~5 seconds
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Frame counter badge */}
              {loadState === "ready" && (
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] text-[#00e599] font-mono border border-[#00e599]/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
                  LIVE · {frameCount} frames
                </div>
              )}
            </div>

            {/* Feedback Panel */}
            <div className="lg:w-[42%] p-5 flex flex-col gap-4 overflow-y-auto max-h-[420px] lg:max-h-none">
              {!postureResult ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
                  <Camera size={32} className="text-gray-600" />
                  <p className="text-gray-500 text-sm">
                    Position yourself in frame to begin analysis
                  </p>
                  <div className="text-xs text-gray-700 bg-white/4 rounded-xl p-3 border border-white/8 text-left space-y-1.5">
                    <p className="text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                      <Info size={12} /> Setup Tips
                    </p>
                    <p>• Place camera 6–8 feet away</p>
                    <p>• Ensure your full body is visible</p>
                    <p>• Good lighting improves accuracy</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Score */}
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl border ${statusBg}`}
                  >
                    <ScoreRing score={postureResult.overallScore} />
                    <div>
                      <p className={`text-xl font-black ${statusColor}`}>
                        {postureResult.status === "good"
                          ? "Great Form!"
                          : postureResult.status === "warning"
                            ? "Needs Work"
                            : "Fix Posture"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {postureResult.overallScore >= 75
                          ? "Keep this up throughout the set"
                          : "Focus on the cues below"}
                      </p>
                    </div>
                  </div>

                  {/* Issues */}
                  {postureResult.issues.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={11} /> Fix These
                      </p>
                      <div className="space-y-2">
                        {postureResult.issues.map((issue, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2.5"
                          >
                            <span className="text-red-400 mt-0.5 shrink-0">
                              ⚠
                            </span>
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {issue}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Praises */}
                  {postureResult.praises.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-[#00e599] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CheckCircle size={11} /> Looking Good
                      </p>
                      <div className="space-y-1.5">
                        {postureResult.praises.map((praise, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 bg-[#00e599]/6 border border-[#00e599]/15 rounded-lg px-3 py-2"
                          >
                            <span className="text-[#00e599] mt-0.5 shrink-0">
                              ✓
                            </span>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {praise}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  <p className="text-[10px] text-gray-700 text-center mt-auto pt-2 border-t border-white/5">
                    AI analysis is a guide only — always listen to your body
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
