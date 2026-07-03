export interface GradeBand {
  label: string;
  /** Inclusive lower bound of the percentage range this grade covers. */
  minPercentage: number;
}

/** The fixed default scale used when a school has not configured its own. */
export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { label: 'A+', minPercentage: 90 },
  { label: 'A', minPercentage: 80 },
  { label: 'B', minPercentage: 70 },
  { label: 'C', minPercentage: 60 },
  { label: 'D', minPercentage: 50 },
  { label: 'E', minPercentage: 40 },
  { label: 'F', minPercentage: 0 },
];

/**
 * Maps a percentage to a grade label using the given bands: the band with the
 * highest `minPercentage` that the percentage still reaches wins. Pure and
 * env-free. Falls back to the lowest band when nothing else matches.
 */
export const gradeForBands = (bands: GradeBand[], percentage: number): string => {
  const sorted = [...bands].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const band of sorted) {
    if (percentage >= band.minPercentage) return band.label;
  }
  return sorted[sorted.length - 1]?.label ?? '—';
};

/** Back-compatible convenience over the default scale. */
export const gradeForPercentage = (percentage: number): string =>
  gradeForBands(DEFAULT_GRADE_BANDS, percentage);
