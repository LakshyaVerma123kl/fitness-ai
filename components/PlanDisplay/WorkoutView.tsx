"use client";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Youtube,
  Image as ImageIcon,
  Flame,
  AlertCircle,
} from "lucide-react";

export default function WorkoutView({
  plan,
  completedExercises,
  toggleExercise,
  onGenerateImage,
}: {
  plan: any;
  completedExercises: Set<string>;
  toggleExercise: (name: string) => void;
  onGenerateImage: (prompt: string, type: string) => void;
}) {
  const hasWorkout = plan.workout && Array.isArray(plan.workout);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid gap-6"
    >
      {hasWorkout ? (
        plan.workout.map((day: any, i: number) => {
          // Calculate total calories for the day if available
          const dailyCalories = day.exercises?.reduce(
            (acc: number, ex: any) => acc + (parseInt(ex.calories) || 0),
            0
          );

          return (
            <div
              key={i}
              className="glass-card p-4 md:p-6 rounded-2xl border border-[var(--color-border)]"
            >
              {/* Day Header */}
              <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[var(--color-text)]">
                    {day.day}
                  </h3>
                  {/* Daily Calorie Summary */}
                  {dailyCalories > 0 && (
                    <p className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                      <Flame size={12} className="fill-orange-400/20" />
                      Total Burn: ~{dailyCalories} kcal
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs md:text-sm font-medium">
                    {day.focus}
                  </span>
                </div>
              </div>

              {/* Notes Section */}
              {day.notes && (
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 italic bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)]">
                  📝 {day.notes}
                </p>
              )}

              {/* Exercises List */}
              <div className="space-y-3">
                {day.exercises?.map((ex: any, j: number) => (
                  <div
                    key={j}
                    className={`p-3 md:p-4 rounded-xl transition-all flex flex-col gap-3 group ${
                      completedExercises.has(ex.name)
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-[var(--color-card)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-start gap-3 md:gap-4 w-full min-w-0">
                      <button
                        onClick={() => toggleExercise(ex.name)}
                        className={`p-1 rounded-full transition-colors mt-0.5 shrink-0 ${
                          completedExercises.has(ex.name)
                            ? "text-green-400"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                      >
                        <CheckCircle size={20} className="md:w-6 md:h-6" />
                      </button>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p
                          className={`font-medium text-sm md:text-base break-words ${
                            completedExercises.has(ex.name)
                              ? "text-[var(--color-text-secondary)] line-through"
                              : "text-[var(--color-text)]"
                          }`}
                        >
                          {ex.name}
                        </p>

                        {/* Stats Row: Sets, Reps, Rest, Calories */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
                          <span>
                            {ex.sets} sets × {ex.reps} reps
                          </span>
                          <span className="opacity-30">•</span>
                          <span>{ex.rest} rest</span>

                          {/* 🔥 Calorie Badge for Exercise */}
                          {ex.calories && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="flex items-center gap-1 text-orange-400 font-medium bg-orange-400/10 px-1.5 py-0.5 rounded">
                                <Flame size={10} className="fill-orange-400" />
                                {ex.calories} kcal
                              </span>
                            </>
                          )}
                        </div>

                        {/* Injury Modification Warning */}
                        {ex.modification && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                            <AlertCircle
                              size={12}
                              className="mt-0.5 shrink-0"
                            />
                            <span>
                              <strong>Mod:</strong> {ex.modification}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full pl-9 sm:pl-11">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          ex.name + " exercise form"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex-1 flex justify-center items-center gap-1.5 text-xs md:text-sm"
                      >
                        <Youtube
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                        <span className="hidden xs:inline">Tutorial</span>
                      </a>

                      <button
                        onClick={() =>
                          onGenerateImage(
                            `fitness exercise: ${ex.name}, proper form, cinematic lighting`,
                            "exercise"
                          )
                        }
                        className="p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-blue-400 flex items-center justify-center gap-1.5 opacity-100 transition-all hover:bg-[var(--color-border)] flex-1 text-xs md:text-sm"
                      >
                        <ImageIcon
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                        <span className="hidden xs:inline">Demo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-[var(--color-text-secondary)]">
          No workout data found.
        </p>
      )}
    </motion.div>
  );
}
