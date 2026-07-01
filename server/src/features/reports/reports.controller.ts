import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { reportsService } from './reports.service';

export const reportsController = {
  students: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.students(requireSchoolId(req.user));
    res.status(200).json({ success: true, data });
  }),

  attendance: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.attendance(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data });
  }),

  finance: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.finance(requireSchoolId(req.user));
    res.status(200).json({ success: true, data });
  }),
};
