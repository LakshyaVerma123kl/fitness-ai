"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Timer } from "lucide-react";

interface WorkoutTimerProps {
  exerciseName: string;
  sets: number;
  reps: string;
  rest: string; // e.g. "60s" or "90 seconds"
  onClose: () => void;
}

function parseSeconds(str: string): number {
  const match = str?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 60;
}

export default function WorkoutTimer({ exerciseName, sets, reps, rest, onClose }: WorkoutTimerProps) {
  const restSeconds = parseSeconds(rest);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0); // work phase shows reps, not timer
  const [restLeft, setRestLeft] = useState(restSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.1;
    utt.volume = 0.9;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  const finishSet = useCallback(() => {
    if (currentSet >= sets) {
      setDone(true);
      setRunning(false);
      speak("Workout complete! Amazing job!");
      return;
    }
    setPhase("rest");
    setRestLeft(restSeconds);
    speak(`Set ${currentSet} done! Rest for ${restSeconds} seconds.`);
  }, [currentSet, sets, restSeconds, speak]);

  const nextSet = useCallback(() => {
    setCurrentSet((s) => s + 1);
    setPhase("work");
    setRunning(false);
    speak(`Set ${currentSet + 1} — ${reps} reps. Go!`);
  }, [currentSet, reps, speak]);

  // Rest countdown
  useEffect(() => {
    if (phase !== "rest" || !running) return;
    if (restLeft <= 0) {
      nextSet();
      return;
    }
    intervalRef.current = setTimeout(() => {
      setRestLeft((s) => s - 1);
      if (restLeft === 4) speak("Get ready!");
      if (restLeft === 1) speak("Go!");
    }, 1000);
    return () => clearTimeout(intervalRef.current!);
  }, [phase, running, restLeft, nextSet, speak]);

  const handleStart = () => {
    setRunning(true);
    if (phase === "work") speak(`Set ${currentSet} — ${reps} reps. Go!`);
  };

  const handleReset = () => {
    setCurrentSet(1);
    setPhase("work");
    setRestLeft(restSeconds);
    setRunning(false);
    setDone(false);
    if (intervalRef.current) clearTimeout(intervalRef.current);
  };

  const restPercent = ((restSeconds - restLeft) / restSeconds) * 100;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-[var(--color-text-secondary)] transition"
        >
          <X size={20} />
        </button>
        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-full text-[var(--color-text-secondary)] transition"
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Exercise Name */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Timer size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--color-text)] line-clamp-1">{exerciseName}</h2>
        </div>

        {done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="py-6">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl font-black text-[var(--color-primary)] mb-2">Done!</p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">All {sets} sets completed!</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-[var(--color-primary)] text-black rounded-xl font-bold hover:opacity-90 transition"
            >
              Restart
            </button>
          </motion.div>
        ) : (
          <>
            {/* Set Progress */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: sets }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i < currentSet - 1
                      ? "bg-[var(--color-primary)] w-6"
                      : i === currentSet - 1
                      ? "bg-[var(--color-primary)] w-8"
                      : "bg-[var(--color-border)] w-6"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest mb-2">
              Set {currentSet} of {sets}
            </p>

            {phase === "work" ? (
              <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-7xl font-black text-[var(--color-text)] mb-2">{reps}</div>
                <p className="text-[var(--color-text-secondary)] text-sm mb-8">reps</p>
                <div className="flex gap-3 justify-center">
                  {running ? (
                    <button
                      onClick={finishSet}
                      className="flex-1 py-4 bg-[var(--color-primary)] text-black font-bold rounded-2xl hover:opacity-90 transition text-lg shadow-lg shadow-green-500/20"
                    >
                      ✓ Done
                    </button>
                  ) : (
                    <button
                      onClick={handleStart}
                      className="flex-1 py-4 bg-[var(--color-primary)] text-black font-bold rounded-2xl hover:opacity-90 transition text-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      <Play size={20} className="fill-black" /> Start Set
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Ring Timer */}
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="var(--color-border)" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      stroke="#00e599"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - restPercent / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-[var(--color-text)]">{restLeft}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">rest</span>
                  </div>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                  Next: Set {currentSet + 1} — {reps} reps
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className="flex-1 py-3 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-bold rounded-2xl hover:bg-[var(--color-border)] transition flex items-center justify-center gap-2"
                  >
                    {running ? <Pause size={18} /> : <Play size={18} />}
                    {running ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={nextSet}
                    className="flex-1 py-3 bg-[var(--color-primary)] text-black font-bold rounded-2xl hover:opacity-90 transition"
                  >
                    Skip Rest →
                  </button>
                </div>
              </motion.div>
            )}

            <button
              onClick={handleReset}
              className="mt-4 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition flex items-center gap-1 mx-auto"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
