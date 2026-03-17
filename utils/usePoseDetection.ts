import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Keypoint, 
  ExerciseProfile, 
  RepState, 
  PostureResult,
  analyze
} from "@/utils/poseAnalysis";

export type Stage =
  | "generating"
  | "loading-tf"
  | "loading-model"
  | "loading-camera"
  | "ready"
  | "error";

export interface AngleMarker {
  joint: string;
  angle: number;
  x: number;
  y: number;
  color: string;
}

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

const POSE_MODELS = [
  { label: "MoveNet Thunder (HD)", type: "SINGLEPOSE_THUNDER" },
  { label: "MoveNet Lightning (Fast)", type: "SINGLEPOSE_LIGHTNING" },
];

export function usePoseDetection(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    resolveProfile: (exerciseName: string) => Promise<{ profile: ExerciseProfile; provider: string }>,
    exerciseName: string,
    voiceOn: boolean,
) {
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
  const [modelLabel, setModelLabel] = useState("");
  const [provider, setProvider] = useState("");
  const [fps, setFps] = useState(0);
  
  const fpsRef = useRef(0);
  const fpsTime = useRef(Date.now());
  
  // Voice state
  let lastSpokenIssue = useRef("");
  let lastRepSpoken = useRef(-1);

  useEffect(() => {
    voiceRef.current = voiceOn;
  }, [voiceOn]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.1;
    u.pitch = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  };

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
          if (top && top !== lastSpokenIssue.current && frameRef.current % 90 === 0) {
            speak(top);
            lastSpokenIssue.current = top;
          }
          const rc = repRef.current.count;
          if (rc > 0 && rc !== lastRepSpoken.current) {
            speak(`${rc}`);
            lastRepSpoken.current = rc;
          }
        }
      }
    } catch (_) {}
    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, canvasRef]);

  const pipeline = useCallback(async () => {
    repRef.current = { count: 0, phase: "up", lastAngle: 180 };
    lastSpokenIssue.current = "";
    lastRepSpoken.current = -1;

    // 1. Resolve profile
    setStage("generating");
    setMsg(`Loading analyzer…`);

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
  }, [exerciseName, resolveProfile, loop, videoRef]);

  const resetReps = () => {
    repRef.current = { count: 0, phase: "up", lastAngle: 180 };
    lastRepSpoken.current = -1;
    setResult((p) => (p ? { ...p, repCount: 0 } : p));
  };
  
  useEffect(() => {
    pipeline();
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      detRef.current?.dispose?.();
      window.speechSynthesis?.cancel();
    };
  }, [pipeline]);

  return {
    stage,
    msg,
    errMsg,
    result,
    modelLabel,
    provider,
    fps,
    profile: profRef.current,
    pipeline,
    resetReps
  };
}
