export interface TaxSlab {
  /** Monthly income floor (inclusive) at which this slab's rate starts applying. */
  minMonthly: number;
  /** Marginal rate (percent, 0–100) applied to income within this slab's band. */
  rate: number;
}

/**
 * Progressive (marginal) monthly tax for an income given a set of slabs. Each
 * slab's rate applies only to the portion of income between its floor and the
 * next slab's floor. Pure and env-free. Returns 0 when there are no slabs.
 *
 * Example: slabs [{0,0},{50000,10},{100000,20}] on income 120000 →
 * 0·50000 + 10%·50000 + 20%·20000 = 9000.
 */
export const computeTax = (income: number, slabs: TaxSlab[]): number => {
  if (income <= 0 || slabs.length === 0) return 0;
  const sorted = [...slabs].sort((a, b) => a.minMonthly - b.minMonthly);
  let tax = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const floor = sorted[i]!.minMonthly;
    if (income <= floor) break;
    const ceiling = sorted[i + 1]?.minMonthly ?? Infinity;
    const band = Math.min(income, ceiling) - floor;
    tax += (band * sorted[i]!.rate) / 100;
  }
  return Math.round(tax);
};
