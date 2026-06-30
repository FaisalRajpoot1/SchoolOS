import type { CookieOptions, Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError } from '@/utils/ApiError';
import { isProduction } from '@/config/env';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS } from '@/config/constants';
import { authService } from './auth.service';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

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
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendAuth(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendAuth(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw ApiError.unauthorized('No session');
    }
    const result = await authService.refresh(token);
    sendAuth(res, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
    res.status(200).json({ success: true, message: 'Logged out' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const user = await authService.me(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  }),
};
