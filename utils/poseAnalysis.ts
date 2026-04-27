/**
 * Pose Analysis & Biomechanics Engine
 * 
 * This file contains pure mathematical and physics logic decoupled from React.
 * It takes raw 2D keypoints (x, y coordinates) from TensorFlow MoveNet and translates them into:
 * 1. Joint angles (e.g., knee flexion, elbow extension)
 * 2. Repetition counting states (eccentric vs concentric phases)
 * 3. Form feedback (identifying if a joint angle violates the exercise profile constraints)
 */
export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

export interface AngleRule {
  name: string;
  points: [string, string, string];
  goodRange: [number, number];
  issue: string;
  praise: string;
  isRepAngle?: boolean;
  repDownThreshold?: number;
  repUpThreshold?: number;
}

export interface AlignmentRule {
  name: string;
  points: [string, string];
  axis: "x" | "y";
  maxDiff: number;
  issue: string;
  praise: string;
}

export interface ExerciseProfile {
  exerciseName: string;
  description: string;
  isRepBased: boolean;
  cameraAngle: string;
  angles: AngleRule[];
  alignments: AlignmentRule[];
  generalTips: string[];
  source: "ai" | "hardcoded" | "fallback";
}

export interface RepState {
  count: number;
  phase: "up" | "down";
  lastAngle: number;
}

export interface PostureResult {
  overallScore: number;
  status: "good" | "warning" | "bad";
  issues: string[];
  praises: string[];
  angles: Record<string, number>;
  repCount?: number;
  phase?: string;
}

// MoveNet keypoints

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

// HARDCODED profiles for the original 7 exercises (fallback)

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
export function matchHardcoded(name: string): ExerciseProfile | null {
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

export const buildPrompt = (exercise: string) =>
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

// Fetch via internal API route (keeps env keys server-side)

export async function fetchProfileFromRoute(
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

// Parse + validate AI response

export function parseProfile(
  text: string,
  source: "ai" | "hardcoded" | "fallback" = "ai",
): ExerciseProfile | null {
  try {
    const clean = text
      .replace(/```json\\s*/gi, "")
      .replace(/```\\s*/gi, "")
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
export function genericFallback(exercise: string): ExerciseProfile {
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

// Profile resolution: hardcoded → AI route → generic fallback

export async function resolveProfile(
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

export function calcAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const rad =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

export function analyze(
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
