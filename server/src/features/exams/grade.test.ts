import { describe, expect, it } from 'vitest';
import { gradeForBands, gradeForPercentage } from './grade';

describe('gradeForPercentage (default scale)', () => {
  it('maps boundary percentages to the correct letter', () => {
    expect(gradeForPercentage(100)).toBe('A+');
    expect(gradeForPercentage(90)).toBe('A+');
    expect(gradeForPercentage(89.9)).toBe('A');
    expect(gradeForPercentage(80)).toBe('A');
    expect(gradeForPercentage(70)).toBe('B');
    expect(gradeForPercentage(60)).toBe('C');
    expect(gradeForPercentage(50)).toBe('D');
    expect(gradeForPercentage(40)).toBe('E');
    expect(gradeForPercentage(39.9)).toBe('F');
    expect(gradeForPercentage(0)).toBe('F');
  });
});

describe('gradeForBands (custom scheme)', () => {
  const bands = [
    { label: 'Distinction', minPercentage: 75 },
    { label: 'Merit', minPercentage: 50 },
    { label: 'Pass', minPercentage: 33 },
    { label: 'Fail', minPercentage: 0 },
  ];

  it('picks the highest floor the percentage reaches, regardless of input order', () => {
    expect(gradeForBands(bands, 90)).toBe('Distinction');
    expect(gradeForBands(bands, 75)).toBe('Distinction');
    expect(gradeForBands(bands, 74.9)).toBe('Merit');
    expect(gradeForBands(bands, 33)).toBe('Pass');
    expect(gradeForBands(bands, 32)).toBe('Fail');
    expect(gradeForBands(bands, 0)).toBe('Fail');
  });

  it('falls back to the lowest band when no floor is reached', () => {
    expect(gradeForBands([{ label: 'X', minPercentage: 50 }], 10)).toBe('X');
  });
});
