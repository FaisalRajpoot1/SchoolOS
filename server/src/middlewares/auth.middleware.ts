import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { verifyAccessToken } from '@/utils/jwt';
import { ApiError } from '@/utils/ApiError';

/**
 * Authenticates a request from its `Authorization: Bearer <token>` header.
 * Populates `req.user` or throws 401.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, schoolId: payload.schoolId };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
};

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 */
export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  };
