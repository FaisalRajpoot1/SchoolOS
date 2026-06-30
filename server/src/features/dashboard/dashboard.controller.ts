import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getOverview(requireSchoolId(req.user));
    res.status(200).json({ success: true, data });
  }),
};
