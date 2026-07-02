import type { CookieOptions, Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError } from '@/utils/ApiError';
import { isProduction } from '@/config/env';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS } from '@/config/constants';
import { auditFromRequest, recordAudit } from '@/features/audit/audit.service';
import { authService, type SessionContext } from './auth.service';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const sessionContext = (req: Request): SessionContext => ({
  userAgent: req.headers['user-agent'] ?? null,
  ipAddress: req.ip ?? null,
});

const refreshCookie = (req: Request): string | undefined =>
  req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

/** Writes the refresh token as an httpOnly cookie and returns the access token. */
const sendAuth = (
  res: Response,
  result: Awaited<ReturnType<typeof authService.login>>,
  status = 200,
): void => {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  res.status(status).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, sessionContext(req));
    await recordAudit('auth.login', auditFromRequest(req, {
      userId: result.user.id,
      schoolId: result.user.schoolId,
    }));
    sendAuth(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = refreshCookie(req);
    if (!token) throw ApiError.unauthorized('No session');
    const result = await authService.refresh(token, sessionContext(req));
    sendAuth(res, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = refreshCookie(req);
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
    if (req.user) {
      await recordAudit('auth.logout', auditFromRequest(req, {
        userId: req.user.id,
        schoolId: req.user.schoolId,
      }));
    }
    res.status(200).json({ success: true, message: 'Logged out' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  }),

  // ---- Password reset ----
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestPasswordReset(req.body.schoolId, req.body.email);
    if (result) {
      await recordAudit('auth.password_reset_requested', auditFromRequest(req, {
        userId: result.userId,
        schoolId: req.body.schoolId,
      }));
    }
    // Never reveal whether the account exists. In non-production, return the
    // token so the flow can be exercised without an email provider wired up.
    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
      ...(isProduction || !result ? {} : { data: { resetToken: result.rawToken } }),
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = await authService.resetPassword(req.body.token, req.body.password);
    await recordAudit('auth.password_reset', auditFromRequest(req, { userId }));
    res.status(200).json({ success: true, message: 'Password updated. Please sign in.' });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
      refreshCookie(req),
    );
    await recordAudit('auth.password_changed', auditFromRequest(req, {
      userId: req.user.id,
      schoolId: req.user.schoolId,
    }));
    res.status(200).json({ success: true, message: 'Password changed.' });
  }),

  // ---- Session management ----
  listSessions: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const sessions = await authService.listSessions(req.user.id, refreshCookie(req));
    res.status(200).json({ success: true, data: sessions });
  }),

  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.revokeSession(req.user.id, req.params.sessionId as string);
    await recordAudit('auth.session_revoked', auditFromRequest(req, {
      userId: req.user.id,
      schoolId: req.user.schoolId,
      metadata: { sessionId: req.params.sessionId },
    }));
    res.status(200).json({ success: true, message: 'Session revoked.' });
  }),

  revokeOtherSessions: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.revokeOtherSessions(req.user.id, refreshCookie(req));
    await recordAudit('auth.sessions_revoked_others', auditFromRequest(req, {
      userId: req.user.id,
      schoolId: req.user.schoolId,
    }));
    res.status(200).json({ success: true, message: 'Other sessions revoked.' });
  }),
};
