import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { schoolsService } from './schools.service';

export const schoolsController = {
  // ---- Platform (SUPER_ADMIN) ----
  create: asyncHandler(async (req: Request, res: Response) => {
    const { school } = await schoolsService.create(req.body);
    res.status(201).json({ success: true, data: { school } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await schoolsService.list(req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolsService.getById(req.params.id as string);
    res.status(200).json({ success: true, data: { school } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolsService.update(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: { school } });
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolsService.setStatus(req.params.id as string, req.body.isActive);
    res.status(200).json({ success: true, data: { school } });
  }),

  // ---- Tenant self-service (SCHOOL_ADMIN) ----
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolsService.getById(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: { school } });
  }),

  updateMine: asyncHandler(async (req: Request, res: Response) => {
    const school = await schoolsService.update(requireSchoolId(req.user), req.body);
    res.status(200).json({ success: true, data: { school } });
  }),
};
