import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Green Valley High School')).toBe('green-valley-high-school');
  });

  it('collapses runs of non-alphanumerics into a single hyphen', () => {
    expect(slugify('A  --  B__C')).toBe('a-b-c');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  !Hello!  ')).toBe('hello');
  });

  it('caps length at 60 characters', () => {
    expect(slugify('x'.repeat(100)).length).toBe(60);
  });
});
