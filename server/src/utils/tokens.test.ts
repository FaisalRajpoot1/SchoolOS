import { describe, expect, it } from 'vitest';
import { generateRefreshToken, hashToken } from './tokens';

describe('tokens', () => {
  it('generates a 96-char hex refresh token', () => {
    const token = generateRefreshToken();
    expect(token).toMatch(/^[0-9a-f]{96}$/);
  });

  it('produces unique tokens', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });

  it('hashes deterministically to a 64-char sha256 hex digest', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes different inputs to different digests', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});
