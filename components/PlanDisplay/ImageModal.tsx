"use client";
import { motion } from "framer-motion";
import { X, Download } from "lucide-react";

export default function ImageModal({
  data,
  loading,
  onClose,
}: {
  data: any;
  loading: boolean;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--color-card)] p-4 rounded-2xl w-full max-w-md md:max-w-lg border border-[var(--color-border)] shadow-2xl relative mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-black/50 rounded-full hover:bg-red-500/20 text-white transition z-10"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg md:text-xl font-bold mb-4 text-[var(--color-text)] pr-8">
          {data.type === "exercise" ? "Workout Demo" : "Meal Idea"}
        </h3>

        {loading ? (
          <div className="h-48 md:h-64 flex flex-col items-center justify-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-blue-500"></div>
            <p className="text-[var(--color-text-secondary)] animate-pulse text-sm md:text-base">
              Generating AI Image...
            </p>
          </div>
        ) : data.image ? (
          <div className="relative group">
            <img
              src={data.image}
              className="w-full rounded-xl shadow-lg"
              alt="Generated"
            />
            <a
              href={data.image}
              download="fitness-ai-image.png"
              className="absolute bottom-3 right-3 md:bottom-4 md:right-4 p-2 bg-black/70 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
            >
              <Download size={18} />
            </a>
          </div>
        ) : (
          <p className="p-6 md:p-8 text-center text-red-400 bg-red-500/10 rounded-xl text-sm">
            Failed to generate image. Please check API keys.
          </p>
        )}
      </motion.div>
    </div>
  );
}
