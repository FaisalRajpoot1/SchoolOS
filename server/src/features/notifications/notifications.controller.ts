import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { notificationsService } from './notifications.service';
import type { ListNotificationsQuery } from './notifications.validation';

/** Notifications belong to the authenticated user within their school. */
const requireUser = (req: Request): { schoolId: string; userId: string } => {
  if (!req.user) throw ApiError.unauthorized();
  return { schoolId: requireSchoolId(req.user), userId: req.user.id };
};

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { schoolId, userId } = requireUser(req);
    const { items, meta } = await notificationsService.list(
      schoolId,
      userId,
      req.query as unknown as ListNotificationsQuery,
    );
    res.status(200).json({ success: true, data: items, meta });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const { schoolId, userId } = requireUser(req);
    const count = await notificationsService.unreadCount(schoolId, userId);
    res.status(200).json({ success: true, data: { count } });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const { schoolId, userId } = requireUser(req);
    await notificationsService.markRead(schoolId, userId, req.params.id as string);
    res.status(204).send();
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const { schoolId, userId } = requireUser(req);
    const result = await notificationsService.markAllRead(schoolId, userId);
    res.status(200).json({ success: true, data: result });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { schoolId, userId } = requireUser(req);
    await notificationsService.remove(schoolId, userId, req.params.id as string);
    res.status(204).send();
  }),
};
