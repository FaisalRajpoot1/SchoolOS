const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const isSafeMethod = (method: string): boolean => SAFE_METHODS.has(method);

/**
 * Decides whether a completed request should be audited: an authenticated,
 * successful, mutating request that isn't an auth endpoint (those record their
 * own semantic events).
 */
export const shouldAudit = (
  method: string,
  statusCode: number,
  hasUser: boolean,
  baseUrl: string,
): boolean =>
  !isSafeMethod(method) && statusCode < 400 && hasUser && !baseUrl.endsWith('/auth');

/** Builds a stable action string from the matched route (param names, not ids). */
export const auditAction = (method: string, baseUrl: string, routePath: string): string =>
  `${method} ${baseUrl}${routePath}`;
