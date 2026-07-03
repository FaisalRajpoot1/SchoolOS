import { describe, expect, it } from 'vitest';
import { formatBackupCode, generateBackupCodes, normalizeBackupCode } from './backupCodes';

describe('formatBackupCode', () => {
  it('groups an 8-char code with a dash', () => {
    expect(formatBackupCode('ABCDEFGH')).toBe('ABCD-EFGH');
  });
  it('leaves other lengths untouched', () => {
    expect(formatBackupCode('ABC')).toBe('ABC');
  });
});

describe('normalizeBackupCode', () => {
  it('uppercases and strips separators so display and raw forms match', () => {
    expect(normalizeBackupCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normalizeBackupCode('ABCD EFGH')).toBe('ABCDEFGH');
    expect(normalizeBackupCode('ABCDEFGH')).toBe('ABCDEFGH');
  });
});

describe('generateBackupCodes', () => {
  it('produces the requested count of distinct, well-formed codes', () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const c of codes) {
      expect(c).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
      // No ambiguous characters.
      expect(c).not.toMatch(/[01OIL]/);
    }
  });
});
