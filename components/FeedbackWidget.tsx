"use client";
// components/FeedbackWidget.tsx
import { useState } from "react";
import { Star, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackWidgetProps {
  planId: string;
  onDone?: () => void;
}

export default function FeedbackWidget({
  planId,
  onDone,
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ratingLabels: { [key: number]: string } = {
    1: "Not helpful",
    2: "Could be better",
    3: "Pretty good",
    4: "Great plan!",
    5: "Absolutely loved it! 🔥",
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/plans/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, rating, feedbackNote: note }),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      setSubmitted(true);
      setTimeout(() => onDone?.(), 1500);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-6"
      >
        <CheckCircle size={40} className="text-[var(--color-primary)]" />
        <p className="font-bold text-[var(--color-text)]">
          Thanks for your feedback! 🙌
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] text-center max-w-xs">
          Your rating helps us improve plans for everyone with a similar
          profile.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Stars */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={32}
              className={`transition-colors ${
                star <= (hovered || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[var(--color-border)] fill-transparent"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {(hovered || rating) > 0 && (
          <motion.p
            key={hovered || rating}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-semibold text-[var(--color-primary)]"
          >
            {ratingLabels[hovered || rating]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Optional note */}
      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any feedback? What worked / what didn't? (optional)"
            rows={2}
            className="w-full p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none resize-none transition-colors"
          />
        </motion.div>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!rating || loading}
        className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="animate-pulse">Submitting…</span>
        ) : (
          <>
            <Send size={16} /> Submit Feedback
          </>
        )}
      </button>
    </motion.div>
  );
}
