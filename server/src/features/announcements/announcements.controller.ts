import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { announcementsService } from './announcements.service';

export const announcementsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const announcement = await announcementsService.create(
      requireSchoolId(req.user),
      req.user.id,
      req.body,
    );
    res.status(201).json({ success: true, data: { announcement } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await announcementsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const announcement = await announcementsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { announcement } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const announcement = await announcementsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { announcement } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await announcementsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  /** Notice board for the current user (empty for accounts without a school). */
  feed: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.user.schoolId) {
      res.status(200).json({ success: true, data: [] });
      return;
    }
    const items = await announcementsService.feed(req.user.schoolId, req.user.role);
    res.status(200).json({ success: true, data: items });
  }),
};
