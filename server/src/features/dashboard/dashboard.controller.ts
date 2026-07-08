import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getOverview(requireSchoolId(req.user));
    res.status(200).json({ success: true, data });
  }),

  teacher: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await dashboardService.getTeacherOverview(requireSchoolId(req.user), req.user.id);
    res.status(200).json({ success: true, data });
  }),
};
