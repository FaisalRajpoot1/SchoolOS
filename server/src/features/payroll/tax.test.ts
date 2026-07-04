import { describe, expect, it } from 'vitest';
import { computeTax, type TaxSlab } from './tax';

const SLABS: TaxSlab[] = [
  { minMonthly: 0, rate: 0 },
  { minMonthly: 50000, rate: 10 },
  { minMonthly: 100000, rate: 20 },
];

describe('computeTax', () => {
  it('is 0 with no slabs or non-positive income', () => {
    expect(computeTax(120000, [])).toBe(0);
    expect(computeTax(0, SLABS)).toBe(0);
    expect(computeTax(-5, SLABS)).toBe(0);
  });

  it('applies each rate marginally to its band', () => {
    // 0·50000 + 10%·50000 + 20%·20000 = 9000
    expect(computeTax(120000, SLABS)).toBe(9000);
  });

  it('taxes only the portion above a floor', () => {
    expect(computeTax(50000, SLABS)).toBe(0); // exactly at the 10% floor → nothing above it
    expect(computeTax(60000, SLABS)).toBe(1000); // 10% of 10000
    expect(computeTax(100000, SLABS)).toBe(5000); // 10% of 50000
  });

  it('is order-independent (sorts slabs)', () => {
    const shuffled = [SLABS[2]!, SLABS[0]!, SLABS[1]!];
    expect(computeTax(120000, shuffled)).toBe(9000);
  });

  it('leaves income below the lowest floor untaxed', () => {
    expect(computeTax(30000, [{ minMonthly: 40000, rate: 10 }])).toBe(0);
  });
});
