import { describe, expect, it } from 'vitest';
import { gradeForPercentage } from './grade';

describe('gradeForPercentage', () => {
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
