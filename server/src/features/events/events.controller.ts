import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { eventsService } from './events.service';

export const eventsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { event } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await eventsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { event } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventsService.update(requireSchoolId(req.user), req.params.id as string, req.body);
    res.status(200).json({ success: true, data: { event } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await eventsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  /** Calendar feed for the current user (empty for accounts without a school). */
  calendar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.user.schoolId) {
      res.status(200).json({ success: true, data: [] });
      return;
    }
    const items = await eventsService.calendar(req.user.schoolId, req.user.role, req.query as never);
    res.status(200).json({ success: true, data: items });
  }),
};
