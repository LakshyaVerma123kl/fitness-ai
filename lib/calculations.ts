/**
 * Shared fitness calculation utilities.
 * Used by api/generate and api/plans routes.
 */

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  "Very Active": 1.725,
};

/**
 * Calculate Body Mass Index.
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === "Male") return Math.round(base + 5);
  if (gender === "Female") return Math.round(base - 161);
  return Math.round(base - 78); // "Other"
}

/**
 * Calculate Total Daily Energy Expenditure.
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}
