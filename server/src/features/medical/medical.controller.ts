import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { medicalService } from './medical.service';

export const medicalController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await medicalService.getProfile(
      requireSchoolId(req.user),
      req.params.studentId as string,
    );
    res.status(200).json({ success: true, data: { profile } });
  }),

  upsertProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await medicalService.upsertProfile(
      requireSchoolId(req.user),
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { profile } });
  }),

  listVisits: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await medicalService.listVisits(
      requireSchoolId(req.user),
      req.query as never,
    );
    res.status(200).json({ success: true, data: items, meta });
  }),

  getVisit: asyncHandler(async (req: Request, res: Response) => {
    const visit = await medicalService.getVisit(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { visit } });
  }),

  createVisit: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const visit = await medicalService.createVisit(
      requireSchoolId(req.user),
      req.user.id,
      req.body,
    );
    res.status(201).json({ success: true, data: { visit } });
  }),

  removeVisit: asyncHandler(async (req: Request, res: Response) => {
    await medicalService.removeVisit(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
