/**
 * Shared streak calculation logic.
 * Previously duplicated between api/progress and api/badges routes.
 */

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Given an array of objects with a `date` property (YYYY-MM-DD strings),
 * calculate the current active streak and the longest ever streak.
 */
export function calculateStreaks(
  completedEntries: { date: string }[]
): StreakResult {
  if (!completedEntries || completedEntries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completedSet = new Set(completedEntries.map((e) => e.date));
  const dates = Array.from(completedSet).sort().reverse(); // Descending

  // --- Current Streak ---
  let currentStreak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .split("T")[0];

  if (completedSet.has(today) || completedSet.has(yesterday)) {
    const dateCheck = new Date();
    if (!completedSet.has(today)) {
      dateCheck.setDate(dateCheck.getDate() - 1);
    }

    while (completedSet.has(dateCheck.toISOString().split("T")[0])) {
      currentStreak++;
      dateCheck.setDate(dateCheck.getDate() - 1);
    }
  }

  // --- Longest Streak ---
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const next = i < dates.length - 1 ? new Date(dates[i + 1]) : null;

    tempStreak++;

    if (next) {
      const diffDays = Math.ceil(
        Math.abs(current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  return { currentStreak, longestStreak };
}
