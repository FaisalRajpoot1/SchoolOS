import { describe, expect, it } from 'vitest';
import { clearedState, isLocked, lockUntil, reachedLockThreshold } from './lockout';

const NOW = new Date('2026-07-03T10:00:00.000Z');
const POLICY = { maxAttempts: 5, lockoutMs: 15 * 60 * 1000 };

describe('isLocked', () => {
  it('is false when there is no lock', () => {
    expect(isLocked(null, NOW)).toBe(false);
  });

  it('is true within the lock window and false once it has passed', () => {
    const future = new Date(NOW.getTime() + 60_000);
    const past = new Date(NOW.getTime() - 60_000);
    expect(isLocked(future, NOW)).toBe(true);
    expect(isLocked(past, NOW)).toBe(false);
    expect(isLocked(NOW, NOW)).toBe(false); // exactly at expiry → not locked
  });
});

describe('reachedLockThreshold', () => {
  it('locks only once the count reaches maxAttempts', () => {
    expect(reachedLockThreshold(4, POLICY)).toBe(false);
    expect(reachedLockThreshold(5, POLICY)).toBe(true);
    expect(reachedLockThreshold(6, POLICY)).toBe(true);
  });
});

describe('lockUntil', () => {
  it('returns now + the lockout duration', () => {
    expect(lockUntil(NOW, POLICY)).toEqual(new Date(NOW.getTime() + POLICY.lockoutMs));
  });
});

describe('clearedState', () => {
  it('resets attempts and lock', () => {
    expect(clearedState()).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
  });
});
