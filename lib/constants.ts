/**
 * Shared constants used across the application.
 * Centralizes values that were previously duplicated in multiple files.
 */

/** Canonical meal slot ordering for diet plans. */
export const MEAL_ORDER = [
  "breakfast",
  "mid_morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
] as const;

/** Human-readable meal labels keyed by slot name. */
export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  mid_morning_snack: "Mid-Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  evening_snack: "Evening Snack",
};
