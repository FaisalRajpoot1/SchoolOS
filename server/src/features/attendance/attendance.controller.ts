import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { attendanceService } from './attendance.service';

export const attendanceController = {
  roster: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as { sectionId: string; date: Date };
    const roster = await attendanceService.roster(
      requireSchoolId(req.user),
      query.sectionId,
      query.date,
    );
    res.status(200).json({ success: true, data: roster });
  }),

  bulkMark: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const roster = await attendanceService.bulkMark(
      requireSchoolId(req.user),
      req.user.id,
      req.body,
    );
    res.status(200).json({ success: true, data: roster });
  }),

  studentHistory: asyncHandler(async (req: Request, res: Response) => {
    const result = await attendanceService.studentHistory(
      requireSchoolId(req.user),
      req.params.studentId as string,
      req.query as never,
    );
    res.status(200).json({ success: true, data: result });
  }),
};
