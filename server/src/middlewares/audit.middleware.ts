import type { NextFunction, Request, Response } from 'express';
import { recordAudit } from '@/features/audit/audit.service';
import { auditAction, isSafeMethod, shouldAudit } from './audit.helpers';

/**
 * Records an audit entry for every authenticated mutation across the API.
 * Attaches a `finish` listener so the outcome (status code) is known; the
 * write is best-effort and never blocks the response. Request bodies are not
 * logged (they may contain secrets) — only the route pattern + path params.
 */
export const auditMutations = (req: Request, res: Response, next: NextFunction): void => {
  if (isSafeMethod(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    if (!shouldAudit(req.method, res.statusCode, !!req.user, req.baseUrl)) return;
    const route = req.route as { path?: string } | undefined;
    const action = auditAction(req.method, req.baseUrl, route?.path ?? req.path);
    void recordAudit(action, {
      userId: req.user?.id ?? null,
      schoolId: req.user?.schoolId ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      metadata: Object.keys(req.params).length > 0 ? { params: req.params } : undefined,
    });
  });

  next();
};
