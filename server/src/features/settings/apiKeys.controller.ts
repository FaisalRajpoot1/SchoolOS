import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { apiKeysService } from './apiKeys.service';

export const apiKeysController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await apiKeysService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: result });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await apiKeysService.list(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await apiKeysService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
