// app/api/pose-profile/route.ts
import { NextRequest, NextResponse } from "next/server";

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

const buildPrompt = (exercise: string) =>
  `You are a certified biomechanics expert. Generate a JSON pose analysis profile for the exercise: "${exercise}"

Available MoveNet keypoints ONLY (do not use any others): ${MOVENET_KPS.join(", ")}

Respond with ONLY valid JSON, no markdown fences, no explanation:

{
  "exerciseName": "string",
  "description": "1 short sentence describing the exercise",
  "isRepBased": boolean,
  "cameraAngle": "side" or "front" or "any",
  "angles": [
    {
      "name": "descriptive joint name e.g. Left Knee",
      "points": ["keypoint_a", "keypoint_vertex", "keypoint_c"],
      "goodRange": [min_degrees, max_degrees],
      "issue": "coaching cue when outside range (under 60 chars)",
      "praise": "positive cue when in range (under 50 chars)",
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
- Only use keypoints from the provided list — never others
- 2–5 angle rules, 0–3 alignment rules
- EXACTLY ONE angle may have isRepAngle:true
- isRepBased:false only for static holds (plank, wall sit, dead hang, etc.)
- repDownThreshold: angle going below this = bottom/down phase
- repUpThreshold: angle going above this = rep completed
- goodRange must reflect CORRECT form degrees for this specific exercise`;

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
  source: "ai";
}

function parseProfile(text: string): ExerciseProfile | null {
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
    json.source = "ai";
    // Filter out any invalid keypoints
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

export async function POST(req: NextRequest) {
  const { exercise } = await req.json();
  if (!exercise || typeof exercise !== "string") {
    return NextResponse.json(
      { error: "Missing exercise name" },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(exercise.trim());

  // ── Try Groq ──────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        const profile = parseProfile(text);
        if (profile)
          return NextResponse.json({ profile, provider: "Groq Llama 3.3" });
      }
    } catch (e) {
      console.error("[pose-profile] Groq error:", e);
    }
  }

  // ── Try Gemini 2.5 Flash ──────────────────────────────────
  const geminiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    for (const model of ["gemini-2.5-flash", "gemini-pro"]) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
            }),
          },
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const profile = parseProfile(text);
          if (profile)
            return NextResponse.json({
              profile,
              provider: `Gemini ${model === "gemini-2.5-flash" ? "2.5 Flash" : "Pro"}`,
            });
        }
      } catch (e) {
        console.error(`[pose-profile] Gemini ${model} error:`, e);
      }
    }
  }

  // ── Try HuggingFace ───────────────────────────────────────
  const hfKey = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  if (hfKey) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/Llama-3.3-70B-Instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        const profile = parseProfile(text);
        if (profile)
          return NextResponse.json({ profile, provider: "HF Llama 3.3" });
      }
    } catch (e) {
      console.error("[pose-profile] HuggingFace error:", e);
    }
  }

  // ── All providers failed ──────────────────────────────────
  return NextResponse.json(
    { error: "All AI providers failed" },
    { status: 503 },
  );
}
