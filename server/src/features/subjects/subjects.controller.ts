import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { subjectsService } from './subjects.service';

export const subjectsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { subject } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await subjectsService.list(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { subject } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await subjectsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
