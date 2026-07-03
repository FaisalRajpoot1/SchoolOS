export interface LockoutPolicy {
  /** Number of consecutive failures that triggers a lock. */
  maxAttempts: number;
  /** How long the account stays locked, in milliseconds. */
  lockoutMs: number;
}

/** True while an account is within its lock window. Pure and env-free. */
export const isLocked = (lockedUntil: Date | null, now: Date): boolean =>
  lockedUntil !== null && lockedUntil.getTime() > now.getTime();

/** Whether the (post-increment) failure count has reached the lock threshold. */
export const reachedLockThreshold = (attempts: number, policy: LockoutPolicy): boolean =>
  attempts >= policy.maxAttempts;

/** The instant a lock set now would expire. */
export const lockUntil = (now: Date, policy: LockoutPolicy): Date =>
  new Date(now.getTime() + policy.lockoutMs);

/** The state to persist after a successful login: a clean slate. */
export const clearedState = (): { failedLoginAttempts: number; lockedUntil: null } => ({
  failedLoginAttempts: 0,
  lockedUntil: null,
});
