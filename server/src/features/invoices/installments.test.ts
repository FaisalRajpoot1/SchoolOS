import { describe, expect, it } from 'vitest';
import { allocateInstallments, scheduledTotal, type PlanInstallment } from './installments';

const PAST = new Date('2026-01-01T00:00:00Z');
const FUTURE = new Date('2026-12-31T00:00:00Z');
const NOW = new Date('2026-07-01T00:00:00Z');

const plan = (): PlanInstallment[] => [
  { seq: 1, label: 'Term 1', dueDate: PAST, amount: 1000 },
  { seq: 2, label: 'Term 2', dueDate: PAST, amount: 1000 },
  { seq: 3, label: 'Term 3', dueDate: FUTURE, amount: 1000 },
];

describe('allocateInstallments', () => {
  it('marks all UPCOMING/OVERDUE when nothing is paid', () => {
    const rows = allocateInstallments(plan(), 0, NOW);
    expect(rows.map((r) => r.status)).toEqual(['OVERDUE', 'OVERDUE', 'UPCOMING']);
    expect(rows.map((r) => r.allocated)).toEqual([0, 0, 0]);
  });

  it('fills earlier installments first (waterfall)', () => {
    const rows = allocateInstallments(plan(), 1500, NOW);
    expect(rows.map((r) => r.allocated)).toEqual([1000, 500, 0]);
    // Installment 1 fully paid; 2 partially covered but past due; 3 untouched & future.
    expect(rows.map((r) => r.status)).toEqual(['PAID', 'OVERDUE', 'UPCOMING']);
  });

  it('marks a partially-covered but not-yet-due installment PARTIAL', () => {
    const rows = allocateInstallments(
      [
        { seq: 1, label: null, dueDate: PAST, amount: 1000 },
        { seq: 2, label: null, dueDate: FUTURE, amount: 1000 },
      ],
      1500,
      NOW,
    );
    expect(rows[1]?.status).toBe('PARTIAL');
    expect(rows[1]?.allocated).toBe(500);
  });

  it('marks everything PAID when fully paid, ignoring due dates', () => {
    const rows = allocateInstallments(plan(), 3000, NOW);
    expect(rows.every((r) => r.status === 'PAID')).toBe(true);
  });

  it('does not over-allocate when overpaid', () => {
    const rows = allocateInstallments(plan(), 99999, NOW);
    expect(rows.map((r) => r.allocated)).toEqual([1000, 1000, 1000]);
  });

  it('sorts by seq before allocating regardless of input order', () => {
    const shuffled = [plan()[2]!, plan()[0]!, plan()[1]!];
    const rows = allocateInstallments(shuffled, 1000, NOW);
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3]);
    expect(rows[0]?.allocated).toBe(1000);
  });

  it('treats a negative paid amount as zero', () => {
    const rows = allocateInstallments(plan(), -50, NOW);
    expect(rows.every((r) => r.allocated === 0)).toBe(true);
  });
});

describe('scheduledTotal', () => {
  it('sums installment amounts', () => {
    expect(scheduledTotal(plan())).toBe(3000);
    expect(scheduledTotal([])).toBe(0);
  });
});
