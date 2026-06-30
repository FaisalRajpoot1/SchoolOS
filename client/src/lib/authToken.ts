/**
 * In-memory access-token holder. Kept out of Redux/localStorage so the
 * token is never persisted to disk; the Axios layer reads it for every
 * request. The refresh token lives in an httpOnly cookie managed by the server.
 */
let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
