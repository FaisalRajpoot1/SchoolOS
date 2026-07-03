import { describe, expect, it } from 'vitest';
import { summarizeRsvps } from './rsvp';

describe('summarizeRsvps', () => {
  it('returns all zeros for an empty list', () => {
    expect(summarizeRsvps([])).toEqual({ going: 0, maybe: 0, notGoing: 0, total: 0 });
  });

  it('folds grouped counts into per-status totals', () => {
    expect(
      summarizeRsvps([
        { status: 'GOING', count: 2 },
        { status: 'MAYBE', count: 1 },
        { status: 'NOT_GOING', count: 3 },
      ]),
    ).toEqual({ going: 2, maybe: 1, notGoing: 3, total: 6 });
  });

  it('ignores unknown statuses', () => {
    expect(
      summarizeRsvps([
        { status: 'GOING', count: 1 },
        { status: 'BOGUS' as never, count: 5 },
      ]),
    ).toEqual({ going: 1, maybe: 0, notGoing: 0, total: 1 });
  });
});
