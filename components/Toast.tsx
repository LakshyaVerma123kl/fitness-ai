// components/Toast.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-400" size={24} />,
    error: <XCircle className="text-red-400" size={24} />,
    warning: <AlertCircle className="text-yellow-400" size={24} />,
  };

  const colors = {
    success: "border-green-500/50 bg-green-500/10",
    error: "border-red-500/50 bg-red-500/10",
    warning: "border-yellow-500/50 bg-yellow-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-100 glass-card border-2 ${colors[type]} rounded-xl shadow-2xl max-w-md backdrop-blur-xl`}
    >
      <div className="flex items-center gap-4 p-4 pr-12">
        <div className="shrink-0">{icons[type]}</div>
        <div className="flex-1">
          <p className="text-[var(--color-text)] font-medium text-sm md:text-base">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-[var(--color-text)]/10 rounded-full transition-colors"
        >
          <X size={18} className="text-[var(--color-text-secondary)]" />
        </button>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={`h-1 ${
            type === "success"
              ? "bg-green-500"
              : type === "error"
              ? "bg-red-500"
              : "bg-yellow-500"
          }`}
        />
      )}
    </motion.div>
  );
}

// Toast Container Component
interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

export function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-0 right-0 z-100 p-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: index * 80 }}
            exit={{ opacity: 0, x: 100 }}
            className="pointer-events-auto mb-3"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
              duration={4000}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
