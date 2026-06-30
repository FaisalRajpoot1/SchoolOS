/** Lifetime of a refresh token in milliseconds (7 days). */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Lifetime of a password-reset token in milliseconds (1 hour). */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** Name of the httpOnly cookie carrying the refresh token. */
export const REFRESH_COOKIE_NAME = 'schoolos_rt';
