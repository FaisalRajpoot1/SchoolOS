export type BehaviorTypeValue = 'MERIT' | 'DEMERIT' | 'INCIDENT';

export interface BehaviorSummary {
  merits: number;
  demerits: number;
  incidents: number;
  total: number;
  netPoints: number;
}

/**
 * Tallies behaviour records into per-type counts and a net point score. Pure
 * and env-free so it can be unit-tested without touching Prisma. Unknown types
 * are ignored but their points still count toward `netPoints` only if typed.
 */
export const summarizeBehavior = (
  records: { type: BehaviorTypeValue; points: number }[],
): BehaviorSummary => {
  const summary: BehaviorSummary = {
    merits: 0,
    demerits: 0,
    incidents: 0,
    total: 0,
    netPoints: 0,
  };
  for (const { type, points } of records) {
    if (type === 'MERIT') summary.merits += 1;
    else if (type === 'DEMERIT') summary.demerits += 1;
    else if (type === 'INCIDENT') summary.incidents += 1;
    else continue;
    summary.total += 1;
    summary.netPoints += points;
  }
  return summary;
};
