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
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  RefreshCw,
  Brain,
  Sparkles,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Keypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}
interface AngleRule {
  name: string;
  points: [string, string, string];
  goodRange: [number, number];
  issue: string;
  praise: string;
  isRepAngle?: boolean;
  repDownThreshold?: number;
  repUpThreshold?: number;
}
interface AlignmentRule {
  name: string;
  points: [string, string];
  axis: "x" | "y";
  maxDiff: number;
  issue: string;
  praise: string;
}
interface ExerciseProfile {
  exerciseName: string;
  description: string;
  isRepBased: boolean;
  cameraAngle: string;
  angles: AngleRule[];
  alignments: AlignmentRule[];
  generalTips: string[];
  source: "ai" | "hardcoded" | "fallback";
}
interface RepState {
  count: number;
  phase: "up" | "down";
  lastAngle: number;
}
interface PostureResult {
  overallScore: number;
  status: "good" | "warning" | "bad";
  issues: string[];
  praises: string[];
  angles: Record<string, number>;
  repCount?: number;
  phase?: string;
}
interface AngleMarker {
  joint: string;
  angle: number;
  x: number;
  y: number;
  color: string;
}

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

// ─────────────────────────────────────────────────────────────
// HARDCODED profiles for the original 7 exercises (fallback)
// ─────────────────────────────────────────────────────────────
const HARDCODED_PROFILES: Record<string, ExerciseProfile> = {
  squat: {
    exerciseName: "Squat",
    description:
      "Compound lower-body movement targeting quads, glutes and hamstrings.",
    isRepBased: true,
    cameraAngle: "side",
    source: "hardcoded",
    angles: [
      {
        name: "Left Knee",
        points: ["left_hip", "left_knee", "left_ankle"],
        goodRange: [70, 115],
        issue: "Aim for 90° knee angle — go deeper",
        praise: "Perfect squat depth ✓",
        isRepAngle: true,
        repDownThreshold: 110,
        repUpThreshold: 155,
      },
      {
        name: "Right Knee",
        points: ["right_hip", "right_knee", "right_ankle"],
        goodRange: [70, 115],
        issue: "Right knee: aim for 90°",
        praise: "Right knee depth good ✓",
      },
      {
        name: "Torso",
        points: ["left_shoulder", "left_hip", "left_knee"],
        goodRange: [60, 120],
        issue: "Keep chest up — torso too far forward",
        praise: "Torso upright ✓",
      },
    ],
    alignments: [
      {
        name: "Knee over ankle",
        points: ["left_knee", "left_ankle"],
        axis: "x",
        maxDiff: 25,
        issue: "Knee caving in — push out over toes",
        praise: "Knee tracking well ✓",
      },
    ],
    generalTips: ["Keep weight through heels", "Brace core before descent"],
  },
  "push-up": {
    exerciseName: "Push-up",
    description:
      "Upper-body pushing exercise for chest, shoulders and triceps.",
    isRepBased: true,
    cameraAngle: "side",
    source: "hardcoded",
    angles: [
      {
        name: "Left Elbow",
        points: ["left_shoulder", "left_elbow", "left_wrist"],
        goodRange: [70, 100],
        issue: "Lower chest to 90° elbow bend",
        praise: "Perfect depth ✓",
        isRepAngle: true,
        repDownThreshold: 100,
        repUpThreshold: 155,
      },
      {
        name: "Right Elbow",
        points: ["right_shoulder", "right_elbow", "right_wrist"],
        goodRange: [70, 100],
        issue: "Right: lower to 90° bend",
        praise: "Right arm depth ✓",
      },
      {
        name: "Body Line",
        points: ["left_shoulder", "left_hip", "left_knee"],
        goodRange: [155, 200],
        issue: "Hips sagging — squeeze core and glutes",
        praise: "Straight body line ✓",
      },
    ],
    alignments: [
      {
        name: "Hip height",
        points: ["left_shoulder", "left_hip"],
        axis: "x",
        maxDiff: 35,
        issue: "Hips too high — lower to straight line",
        praise: "Hip position good ✓",
      },
    ],
    generalTips: ["Tuck elbows 45° toward ribs", "Keep neck neutral"],
  },
  plank: {
    exerciseName: "Plank",
    description: "Isometric core exercise — hold a straight body line.",
    isRepBased: false,
    cameraAngle: "side",
    source: "hardcoded",
    angles: [
      {
        name: "Body Alignment",
        points: ["left_shoulder", "left_hip", "left_ankle"],
        goodRange: [155, 205],
        issue: "Hips dropping — brace entire core",
        praise: "Perfect plank alignment ✓",
      },
    ],
    alignments: [
      {
        name: "Shoulder over elbow",
        points: ["left_shoulder", "left_elbow"],
        axis: "y",
        maxDiff: 50,
        issue: "Stack shoulders over elbows",
        praise: "Shoulder stack solid ✓",
      },
      {
        name: "Shoulder level",
        points: ["left_shoulder", "right_shoulder"],
        axis: "y",
        maxDiff: 20,
        issue: "Shoulders uneven — avoid rotating",
        praise: "Shoulders level ✓",
      },
      {
        name: "Hip level",
        points: ["left_hip", "right_hip"],
        axis: "y",
        maxDiff: 20,
        issue: "Hips tilting — square to floor",
        praise: "Hips square ✓",
      },
    ],
    generalTips: ["Breathe steadily", "Squeeze glutes and quads throughout"],
  },
  deadlift: {
    exerciseName: "Deadlift",
    description:
      "Hip-hinge movement for posterior chain — hamstrings, glutes, back.",
    isRepBased: true,
    cameraAngle: "side",
    source: "hardcoded",
    angles: [
      {
        name: "Hip Hinge",
        points: ["left_shoulder", "left_hip", "left_knee"],
        goodRange: [90, 180],
        issue: "Back rounding — hinge hips, chest up",
        praise: "Hip hinge solid ✓",
        isRepAngle: true,
        repDownThreshold: 130,
        repUpThreshold: 165,
      },
      {
        name: "Knee Angle",
        points: ["left_hip", "left_knee", "left_ankle"],
        goodRange: [130, 180],
        issue: "Too much knee bend — keep legs straighter",
        praise: "Leg position correct ✓",
      },
    ],
    alignments: [
      {
        name: "Shoulder level",
        points: ["left_shoulder", "right_shoulder"],
        axis: "y",
        maxDiff: 25,
        issue: "Shoulders uneven — keep bar level",
        praise: "Bar path level ✓",
      },
    ],
    generalTips: ["Bar stays close to body", "Push floor away, don't pull up"],
  },
  lunge: {
    exerciseName: "Lunge",
    description:
      "Unilateral lower-body movement for quads, glutes and balance.",
    isRepBased: true,
    cameraAngle: "side",
    source: "hardcoded",
    angles: [
      {
        name: "Front Knee",
        points: ["left_hip", "left_knee", "left_ankle"],
        goodRange: [80, 105],
        issue: "Front knee past toes — step forward more",
        praise: "Front knee angle perfect ✓",
        isRepAngle: true,
        repDownThreshold: 110,
        repUpThreshold: 155,
      },
      {
        name: "Back Knee",
        points: ["right_hip", "right_knee", "right_ankle"],
        goodRange: [70, 110],
        issue: "Back knee: lower toward 90°",
        praise: "Back knee good ✓",
      },
    ],
    alignments: [
      {
        name: "Torso upright",
        points: ["left_shoulder", "left_hip"],
        axis: "x",
        maxDiff: 30,
        issue: "Lean torso upright — avoid collapsing forward",
        praise: "Torso upright ✓",
      },
    ],
    generalTips: [
      "Keep front shin vertical",
      "Step far enough to keep knee safe",
    ],
  },
  "bicep curl": {
    exerciseName: "Bicep Curl",
    description: "Isolation curl for biceps — keep upper arms fixed.",
    isRepBased: true,
    cameraAngle: "front",
    source: "hardcoded",
    angles: [
      {
        name: "Left Curl",
        points: ["left_shoulder", "left_elbow", "left_wrist"],
        goodRange: [30, 70],
        issue: "Curl higher — full contraction at top",
        praise: "Full curl range ✓",
        isRepAngle: true,
        repDownThreshold: 70,
        repUpThreshold: 155,
      },
      {
        name: "Right Curl",
        points: ["right_shoulder", "right_elbow", "right_wrist"],
        goodRange: [30, 70],
        issue: "Right: curl higher for full range",
        praise: "Right curl range ✓",
      },
    ],
    alignments: [
      {
        name: "No elbow drift",
        points: ["left_elbow", "left_shoulder"],
        axis: "x",
        maxDiff: 30,
        issue: "Elbow drifting forward — pin to side",
        praise: "Elbow fixed ✓",
      },
    ],
    generalTips: ["Squeeze at the top", "Lower slowly for 2–3 seconds"],
  },
  "shoulder press": {
    exerciseName: "Shoulder Press",
    description: "Overhead pressing movement for deltoids and triceps.",
    isRepBased: true,
    cameraAngle: "front",
    source: "hardcoded",
    angles: [
      {
        name: "Left Press",
        points: ["left_shoulder", "left_elbow", "left_wrist"],
        goodRange: [150, 180],
        issue: "Extend fully overhead",
        praise: "Full overhead extension ✓",
        isRepAngle: true,
        repDownThreshold: 110,
        repUpThreshold: 155,
      },
      {
        name: "Right Press",
        points: ["right_shoulder", "right_elbow", "right_wrist"],
        goodRange: [150, 180],
        issue: "Right: press fully overhead",
        praise: "Right arm extended ✓",
      },
    ],
    alignments: [
      {
        name: "Core stable",
        points: ["left_shoulder", "left_hip"],
        axis: "x",
        maxDiff: 40,
        issue: "Excessive back arch — brace core",
        praise: "Good core stability ✓",
      },
    ],
    generalTips: ["Start with elbows at shoulder height", "Avoid leaning back"],
  },
};

// Match exercise name → hardcoded profile
function matchHardcoded(name: string): ExerciseProfile | null {
  const n = name.toLowerCase().trim();
  if (
    n.includes("squat") &&
    !n.includes("bulgarian") &&
    !n.includes("goblet") &&
    !n.includes("sumo") &&
    !n.includes("split")
  )
    return HARDCODED_PROFILES.squat;
  if (n.includes("push") && (n.includes("up") || n.includes("-up")))
    return HARDCODED_PROFILES["push-up"];
  if (n.includes("plank")) return HARDCODED_PROFILES.plank;
  if (
    n.includes("deadlift") &&
    !n.includes("romanian") &&
    !n.includes("rdl") &&
    !n.includes("sumo")
  )
    return HARDCODED_PROFILES.deadlift;
  if (
    n.includes("lunge") &&
    !n.includes("bulgarian") &&
    !n.includes("reverse") &&
    !n.includes("walking")
  )
    return HARDCODED_PROFILES.lunge;
  if (
    n.includes("bicep") ||
    (n.includes("curl") && !n.includes("nordic") && !n.includes("leg"))
  )
    return HARDCODED_PROFILES["bicep curl"];
  if ((n.includes("shoulder") || n.includes("overhead")) && n.includes("press"))
    return HARDCODED_PROFILES["shoulder press"];
  return null;
}

// ─────────────────────────────────────────────────────────────
// AI Providers — reads from Next.js env vars (server-side only)
// So we call a thin internal API route that proxies the request
// ─────────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: "groq", model: "llama-3.3-70b-versatile", name: "Groq Llama 3.3" },
  { id: "gemini", model: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini", model: "gemini-pro", name: "Gemini Pro" },
  {
    id: "huggingface",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    name: "HF Llama 3.3",
  },
];

const buildPrompt = (exercise: string) =>
  `You are a certified biomechanics expert. Generate a JSON pose analysis profile for the exercise: "${exercise}"

Available MoveNet keypoints ONLY (do not use any others): ${MOVENET_KPS.join(", ")}

Respond with ONLY valid JSON, no markdown fences, no explanation:

{
  "exerciseName": "string",
  "description": "1 short sentence",
  "isRepBased": boolean,
  "cameraAngle": "side" or "front" or "any",
  "angles": [
    {
      "name": "descriptive joint name",
      "points": ["keypoint_a", "keypoint_vertex", "keypoint_c"],
      "goodRange": [min_degrees, max_degrees],
      "issue": "coaching cue when bad (under 60 chars)",
      "praise": "positive cue when good (under 50 chars)",
      "isRepAngle": true or false,
      "repDownThreshold": number,
      "repUpThreshold": number
    }
  ],
  "alignments": [
    {
      "name": "check name",
      "points": ["keypoint_a", "keypoint_b"],
      "axis": "x" or "y",
      "maxDiff": 10-50,
      "issue": "coaching cue",
      "praise": "positive cue"
    }
  ],
  "generalTips": ["tip1", "tip2"]
}

Critical rules:
- Only use keypoints from the list above — nothing else
- 2–5 angle rules, 0–3 alignment rules
- EXACTLY ONE angle may have isRepAngle:true (the primary movement joint)
- isRepBased:false only for static holds (plank, wall sit, dead hang)
- repDownThreshold: angle going below this = "down phase"
- repUpThreshold: angle going above this = rep completed
- goodRange must reflect CORRECT form degrees for this specific exercise`;

// ─────────────────────────────────────────────────────────────
// Fetch via internal API route (keeps env keys server-side)
// ─────────────────────────────────────────────────────────────
async function fetchProfileFromRoute(
  exercise: string,
): Promise<{ profile: ExerciseProfile; provider: string } | null> {
  try {
    const res = await fetch("/api/pose-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.profile && data.provider) return data;
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Parse + validate AI response
// ─────────────────────────────────────────────────────────────
function parseProfile(
  text: string,
  source: "ai" | "hardcoded" | "fallback" = "ai",
): ExerciseProfile | null {
  try {
    const clean = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    const s = clean.indexOf("{"),
      e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) return null;
    const json = JSON.parse(clean.slice(s, e + 1));
    if (!json.angles || !Array.isArray(json.angles) || !json.exerciseName)
      return null;
    json.alignments = json.alignments ?? [];
    json.generalTips = json.generalTips ?? [];
    json.isRepBased = json.isRepBased ?? true;
    json.cameraAngle = json.cameraAngle ?? "any";
    json.source = source;
    json.angles = json.angles.filter(
      (a: AngleRule) =>
        a.points?.length === 3 &&
        a.points.every((p: string) => MOVENET_KPS.includes(p)),
    );
    json.alignments = json.alignments.filter(
      (a: AlignmentRule) =>
        a.points?.length === 2 &&
        a.points.every((p: string) => MOVENET_KPS.includes(p)),
    );
    if (json.angles.length === 0) return null;
    return json as ExerciseProfile;
  } catch {
    return null;
  }
}

// Generic last-resort fallback
function genericFallback(exercise: string): ExerciseProfile {
  return {
    exerciseName: exercise,
    description:
      "General movement analysis — position yourself fully in frame.",
    isRepBased: true,
    cameraAngle: "any",
    source: "fallback",
    angles: [
      {
        name: "Left Knee",
        points: ["left_hip", "left_knee", "left_ankle"],
        goodRange: [70, 180],
        issue: "Watch knee alignment",
        praise: "Knee position good ✓",
        isRepAngle: true,
        repDownThreshold: 110,
        repUpThreshold: 155,
      },
      {
        name: "Left Elbow",
        points: ["left_shoulder", "left_elbow", "left_wrist"],
        goodRange: [30, 180],
        issue: "Check elbow position",
        praise: "Elbow looks good ✓",
      },
    ],
    alignments: [
      {
        name: "Shoulder Level",
        points: ["left_shoulder", "right_shoulder"],
        axis: "y",
        maxDiff: 30,
        issue: "Keep shoulders level",
        praise: "Shoulders balanced ✓",
      },
    ],
    generalTips: ["Keep core engaged", "Breathe steadily throughout"],
  };
}

// ─────────────────────────────────────────────────────────────
// Profile resolution: hardcoded → AI route → generic fallback
// ─────────────────────────────────────────────────────────────
async function resolveProfile(
  exercise: string,
): Promise<{ profile: ExerciseProfile; provider: string }> {
  // 1. Try hardcoded (instant, most reliable for common exercises)
  const hardcoded = matchHardcoded(exercise);
  if (hardcoded) return { profile: hardcoded, provider: "Built-in analyzer" };

  // 2. Try AI via server route
  const aiResult = await fetchProfileFromRoute(exercise);
  if (aiResult) return aiResult;

  // 3. Generic fallback
  return { profile: genericFallback(exercise), provider: "Generic fallback" };
}

// ─────────────────────────────────────────────────────────────
// Analysis engine
// ─────────────────────────────────────────────────────────────
function analyze(
  kps: Keypoint[],
  profile: ExerciseProfile,
  rep: RepState,
): PostureResult {
  const m: Record<string, Keypoint> = {};
  kps.forEach((k) => {
    if (k.name) m[k.name] = k;
  });

  const issues: string[] = [],
    praises: string[] = [],
    angles: Record<string, number> = {};
  let score = 100;
  const perIssue = Math.max(
    10,
    Math.floor(
      80 / Math.max(profile.angles.length + profile.alignments.length, 1),
    ),
  );

  for (const rule of profile.angles) {
    const [pA, pV, pC] = rule.points;
    const kA = m[pA],
      kV = m[pV],
      kC = m[pC];
    if (
      !kA ||
      !kV ||
      !kC ||
      (kA.score ?? 1) < 0.25 ||
      (kV.score ?? 1) < 0.25 ||
      (kC.score ?? 1) < 0.25
    )
      continue;
    const angle = calcAngle(kA, kV, kC);
    angles[rule.name] = angle;
    const ok = angle >= rule.goodRange[0] && angle <= rule.goodRange[1];
    if (ok) praises.push(rule.praise);
    else {
      issues.push(rule.issue);
      score -= perIssue;
    }
    if (
      rule.isRepAngle &&
      rule.repDownThreshold != null &&
      rule.repUpThreshold != null
    ) {
      if (rep.phase === "up" && angle < rule.repDownThreshold)
        rep.phase = "down";
      else if (rep.phase === "down" && angle > rule.repUpThreshold) {
        rep.phase = "up";
        rep.count++;
      }
      rep.lastAngle = angle;
    }
  }

  for (const rule of profile.alignments) {
    const kA = m[rule.points[0]],
      kB = m[rule.points[1]];
    if (!kA || !kB || (kA.score ?? 1) < 0.25 || (kB.score ?? 1) < 0.25)
      continue;
    const diff =
      rule.axis === "x" ? Math.abs(kA.x - kB.x) : Math.abs(kA.y - kB.y);
    if (diff > rule.maxDiff) {
      issues.push(rule.issue);
      score -= Math.floor(perIssue * 0.6);
    } else praises.push(rule.praise);
  }

  if (!issues.length && !praises.length) praises.push("Keep it up! 💪");
  return {
    overallScore: Math.max(0, score),
    status: score >= 75 ? "good" : score >= 50 ? "warning" : "bad",
    issues,
    praises,
    angles,
    repCount: rep.count,
    phase: rep.phase,
  };
}

function calcAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const rad =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

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

// ─────────────────────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
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

// ─────────────────────────────────────────────────────────────
// Source badge
// ─────────────────────────────────────────────────────────────
function SourceBadge({
  source,
  provider,
}: {
  source: ExerciseProfile["source"];
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

type Stage =
  | "generating"
  | "loading-tf"
  | "loading-model"
  | "loading-camera"
  | "ready"
  | "error";

const POSE_MODELS = [
  { label: "MoveNet Thunder (HD)", type: "SINGLEPOSE_THUNDER" },
  { label: "MoveNet Lightning (Fast)", type: "SINGLEPOSE_LIGHTNING" },
];

export default function PoseDetectionModal({ exerciseName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const detRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const repRef = useRef<RepState>({ count: 0, phase: "up", lastAngle: 180 });
  const profRef = useRef<ExerciseProfile | null>(null);
  const frameRef = useRef(0);
  const voiceRef = useRef(true);

  const [stage, setStage] = useState<Stage>("generating");
  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState<PostureResult | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [modelLabel, setModelLabel] = useState("");
  const [provider, setProvider] = useState("");
  const [fps, setFps] = useState(0);
  const fpsRef = useRef(0);
  const fpsTime = useRef(Date.now());

  useEffect(() => {
    voiceRef.current = voiceOn;
  }, [voiceOn]);

  // ── Pipeline ───────────────────────────────────────────────
  const pipeline = useCallback(async () => {
    repRef.current = { count: 0, phase: "up", lastAngle: 180 };
    lastSpokenIssue = "";
    lastRepSpoken = -1;

    // 1. Resolve profile (hardcoded → AI → fallback)
    setStage("generating");
    const isCommon = matchHardcoded(exerciseName) !== null;
    setMsg(
      isCommon
        ? `Loading "${exerciseName}" analyzer…`
        : `AI generating "${exerciseName}" profile…`,
    );

    const { profile, provider: prov } = await resolveProfile(exerciseName);
    profRef.current = profile;
    setProvider(prov);

    // 2. TF.js
    setStage("loading-tf");
    setMsg("Loading TensorFlow.js…");
    try {
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.setBackend("webgl");
      await tf.ready();
      tf.zeros([1, 192, 192, 3]).dispose();
    } catch {
      setErrMsg("WebGL unavailable — use Chrome or Edge.");
      setStage("error");
      return;
    }

    // 3. Pose model
    setStage("loading-model");
    const pd = await import("@tensorflow-models/pose-detection");
    let det: any = null;
    for (const cfg of POSE_MODELS) {
      try {
        setMsg(`Loading ${cfg.label}…`);
        det = await pd.createDetector(pd.SupportedModels.MoveNet, {
          modelType: (pd.movenet.modelType as any)[cfg.type],
          enableSmoothing: true,
          minPoseScore: 0.2,
        });
        setModelLabel(cfg.label);
        break;
      } catch {
        det = null;
      }
    }
    if (!det) {
      setErrMsg("Pose model failed to load.");
      setStage("error");
      return;
    }
    detRef.current = det;

    // 4. Camera
    setStage("loading-camera");
    setMsg("Starting camera…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErrMsg(
        e.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera."
          : e.message,
      );
      setStage("error");
      return;
    }

    setStage("ready");
    loop();
  }, [exerciseName]);

  // ── Detection loop ─────────────────────────────────────────
  const loop = useCallback(async () => {
    const video = videoRef.current,
      canvas = canvasRef.current;
    const det = detRef.current,
      prof = profRef.current;
    if (!video || !canvas || !det || !prof || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    try {
      const poses = await det.estimatePoses(video, {
        maxPoses: 1,
        flipHorizontal: false,
      });
      if (poses.length > 0) {
        const kps = poses[0].keypoints as Keypoint[];
        const res = analyze(kps, prof, repRef.current);
        drawFrame(canvas, kps, res.status, buildMarkers(kps, prof, res.angles));
        setResult({ ...res, repCount: repRef.current.count });

        fpsRef.current++;
        const now = Date.now();
        if (now - fpsTime.current >= 1000) {
          setFps(fpsRef.current);
          fpsRef.current = 0;
          fpsTime.current = now;
        }

        frameRef.current++;
        if (voiceRef.current) {
          const top = res.issues[0];
          if (top && top !== lastSpokenIssue && frameRef.current % 90 === 0) {
            speak(top);
            lastSpokenIssue = top;
          }
          const rc = repRef.current.count;
          if (rc > 0 && rc !== lastRepSpoken) {
            speak(`${rc}`);
            lastRepSpoken = rc;
          }
        }
      }
    } catch (_) {}
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    pipeline();
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      detRef.current?.dispose?.();
      window.speechSynthesis?.cancel();
    };
  }, [pipeline]);

  const resetReps = () => {
    repRef.current = { count: 0, phase: "up", lastAngle: 180 };
    lastRepSpoken = -1;
    setResult((p) => (p ? { ...p, repCount: 0 } : p));
  };

  const prof = profRef.current;
  const isRepBased = prof?.isRepBased ?? true;
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
                  {provider && prof && (
                    <SourceBadge source={prof.source} provider={provider} />
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
                  {prof?.cameraAngle && prof.cameraAngle !== "any" && (
                    <div className="px-2.5 py-1 bg-black/70 border border-white/10 rounded-full text-[10px] text-gray-400 font-mono">
                      📷 {prof.cameraAngle} view
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feedback panel */}
            <div className="lg:w-[40%] flex flex-col overflow-y-auto">
              <div className="p-4 sm:p-5 space-y-4 flex-1">
                {prof?.description && stage === "ready" && (
                  <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <Activity
                      size={11}
                      className="text-gray-500 mt-0.5 shrink-0"
                    />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {prof.description}
                    </p>
                  </div>
                )}

                {!result ? (
                  <div className="flex flex-col items-center gap-3 text-center py-6">
                    <Camera size={26} className="text-gray-600" />
                    <p className="text-gray-500 text-sm">
                      Stand in frame to begin analysis
                    </p>
                    {prof && (
                      <div className="text-xs text-left w-full bg-white/4 border border-white/8 rounded-xl p-4 space-y-1.5">
                        <p className="text-gray-400 font-semibold mb-1">
                          Tracking {prof.angles.length} joint angles:
                        </p>
                        {prof.angles.map((a) => (
                          <p key={a.name} className="text-gray-600">
                            • {a.name} — good: {a.goodRange[0]}°–
                            {a.goodRange[1]}°
                          </p>
                        ))}
                        {prof.generalTips.length > 0 && (
                          <>
                            <p className="text-gray-400 font-semibold mt-2 mb-1">
                              Tips:
                            </p>
                            {prof.generalTips.map((t, i) => (
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
                    <div
                      className={`flex items-center gap-4 p-4 rounded-xl border ${statusBg}`}
                    >
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

                    {result.issues.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <AlertTriangle size={10} /> Fix These
                        </p>
                        <div className="space-y-1.5">
                          {result.issues.map((issue, i) => (
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
                    )}

                    {result.praises.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#00e599] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <CheckCircle size={10} /> Looking Good
                        </p>
                        <div className="space-y-1">
                          {result.praises.map((p, i) => (
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
                    )}

                    {Object.keys(result.angles).length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Zap size={10} /> Joint Angles
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(result.angles).map(
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
                    )}

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
