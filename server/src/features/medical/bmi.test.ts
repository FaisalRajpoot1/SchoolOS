import { describe, expect, it } from 'vitest';
import { bmi } from './bmi';

describe('bmi', () => {
  it('computes BMI rounded to one decimal', () => {
    // 1.70 m, 70 kg → 24.221… → 24.2
    expect(bmi(170, 70)).toBe(24.2);
    // 1.60 m, 50 kg → 19.531… → 19.5
    expect(bmi(160, 50)).toBe(19.5);
  });

  it('returns null when height or weight is missing or non-positive', () => {
    expect(bmi(null, 70)).toBeNull();
    expect(bmi(170, null)).toBeNull();
    expect(bmi(0, 70)).toBeNull();
    expect(bmi(170, 0)).toBeNull();
    expect(bmi(-170, 70)).toBeNull();
  });
});
