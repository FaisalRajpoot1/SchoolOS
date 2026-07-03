import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { behaviorService } from './behavior.service';

export const behaviorController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const record = await behaviorService.create(requireSchoolId(req.user), req.user.id, req.body);
    res.status(201).json({ success: true, data: { record } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await behaviorService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  studentSummary: asyncHandler(async (req: Request, res: Response) => {
    const data = await behaviorService.studentSummary(
      requireSchoolId(req.user),
      req.params.studentId as string,
    );
    res.status(200).json({ success: true, data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const record = await behaviorService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { record } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const record = await behaviorService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { record } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await behaviorService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
