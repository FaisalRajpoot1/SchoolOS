import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { feeCategoriesService } from './feeCategories.service';

export const feeCategoriesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await feeCategoriesService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { category } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await feeCategoriesService.list(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await feeCategoriesService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { category } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await feeCategoriesService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
