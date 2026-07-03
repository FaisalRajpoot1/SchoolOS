import { describe, expect, it } from 'vitest';
import { summarizeBehavior } from './behavior.summary';

describe('summarizeBehavior', () => {
  it('returns zeros for an empty list', () => {
    expect(summarizeBehavior([])).toEqual({
      merits: 0,
      demerits: 0,
      incidents: 0,
      total: 0,
      netPoints: 0,
    });
  });

  it('counts each type and sums signed points', () => {
    expect(
      summarizeBehavior([
        { type: 'MERIT', points: 5 },
        { type: 'MERIT', points: 3 },
        { type: 'DEMERIT', points: -4 },
        { type: 'INCIDENT', points: 0 },
      ]),
    ).toEqual({ merits: 2, demerits: 1, incidents: 1, total: 4, netPoints: 4 });
  });

  it('ignores unknown types', () => {
    expect(
      summarizeBehavior([
        { type: 'MERIT', points: 2 },
        { type: 'BOGUS' as never, points: 100 },
      ]),
    ).toEqual({ merits: 1, demerits: 0, incidents: 0, total: 1, netPoints: 2 });
  });
});
