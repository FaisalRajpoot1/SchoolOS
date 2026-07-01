import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { parentsService } from './parents.service';

export const parentsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const parent = await parentsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { parent } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await parentsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const parent = await parentsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { parent } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const parent = await parentsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { parent } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await parentsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  linkChild: asyncHandler(async (req: Request, res: Response) => {
    const parent = await parentsService.linkChild(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { parent } });
  }),

  unlinkChild: asyncHandler(async (req: Request, res: Response) => {
    const parent = await parentsService.unlinkChild(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
    );
    res.status(200).json({ success: true, data: { parent } });
  }),
};
