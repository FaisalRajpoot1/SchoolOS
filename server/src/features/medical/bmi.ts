/**
 * Body Mass Index from height (cm) and weight (kg), rounded to one decimal.
 * Returns null when either input is missing or non-positive. Pure and env-free
 * so it can be unit-tested without touching Prisma.
 */
export const bmi = (heightCm: number | null, weightKg: number | null): number | null => {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const metres = heightCm / 100;
  return Math.round((weightKg / (metres * metres)) * 10) / 10;
};
