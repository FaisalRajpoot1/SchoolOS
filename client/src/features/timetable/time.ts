/** Converts minutes-from-midnight to an "HH:MM" string. */
export const minutesToTime = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Converts an "HH:MM" string to minutes-from-midnight. */
export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
