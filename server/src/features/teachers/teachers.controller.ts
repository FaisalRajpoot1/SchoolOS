import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { teachersService } from './teachers.service';

export const teachersController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const teacher = await teachersService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { teacher } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await teachersService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const teacher = await teachersService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { teacher } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const teacher = await teachersService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { teacher } });
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const teacher = await teachersService.setStatus(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body.status,
    );
    res.status(200).json({ success: true, data: { teacher } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await teachersService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
