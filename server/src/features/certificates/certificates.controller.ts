import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { certificatesService } from './certificates.service';

export const certificatesController = {
  issue: asyncHandler(async (req: Request, res: Response) => {
    const certificate = await certificatesService.issue(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { certificate } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await certificatesService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const certificate = await certificatesService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { certificate } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await certificatesService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  /** Public — no authentication. */
  verify: asyncHandler(async (req: Request, res: Response) => {
    const result = await certificatesService.verify(req.params.code as string);
    res.status(200).json({ success: true, data: result });
  }),
};
