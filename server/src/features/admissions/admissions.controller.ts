import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { admissionsService } from './admissions.service';

export const admissionsController = {
  // ---- Public ----
  publicSchool: asyncHandler(async (req: Request, res: Response) => {
    const school = await admissionsService.publicSchool(req.params.schoolId as string);
    res.status(200).json({ success: true, data: { school } });
  }),

  apply: asyncHandler(async (req: Request, res: Response) => {
    const result = await admissionsService.apply(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  // ---- Admin ----
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await admissionsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const application = await admissionsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { application } });
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const application = await admissionsService.setStatus(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { application } });
  }),

  convert: asyncHandler(async (req: Request, res: Response) => {
    const student = await admissionsService.convert(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { student } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await admissionsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
