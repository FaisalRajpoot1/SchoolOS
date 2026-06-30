import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { academicYearsService } from './academicYears.service';

export const academicYearsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const year = await academicYearsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { academicYear: year } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await academicYearsService.list(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const year = await academicYearsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { academicYear: year } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const year = await academicYearsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { academicYear: year } });
  }),

  setCurrent: asyncHandler(async (req: Request, res: Response) => {
    const year = await academicYearsService.setCurrent(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: { academicYear: year } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await academicYearsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
