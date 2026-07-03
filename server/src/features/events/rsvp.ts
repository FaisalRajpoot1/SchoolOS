export type RsvpStatusValue = 'GOING' | 'MAYBE' | 'NOT_GOING';

export interface RsvpCounts {
  going: number;
  maybe: number;
  notGoing: number;
  total: number;
}

/**
 * Folds per-status group counts (as returned by a Prisma `groupBy`) into a flat
 * `RsvpCounts`. Pure and env-free so it can be unit-tested without touching
 * Prisma. Unknown statuses are ignored.
 */
export const summarizeRsvps = (groups: { status: RsvpStatusValue; count: number }[]): RsvpCounts => {
  const counts: RsvpCounts = { going: 0, maybe: 0, notGoing: 0, total: 0 };
  for (const { status, count } of groups) {
    if (status === 'GOING') counts.going += count;
    else if (status === 'MAYBE') counts.maybe += count;
    else if (status === 'NOT_GOING') counts.notGoing += count;
    else continue;
    counts.total += count;
  }
  return counts;
};
