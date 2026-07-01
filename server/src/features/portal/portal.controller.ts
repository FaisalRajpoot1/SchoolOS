import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError } from '@/utils/ApiError';
import { portalService } from './portal.service';

const userId = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const portalController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const data = await portalService.me(userId(req));
    res.status(200).json({ success: true, data });
  }),

  childAttendance: asyncHandler(async (req: Request, res: Response) => {
    const data = await portalService.childAttendance(
      userId(req),
      req.params.studentId as string,
      req.query as never,
    );
    res.status(200).json({ success: true, data });
  }),

  childInvoices: asyncHandler(async (req: Request, res: Response) => {
    const data = await portalService.childInvoices(userId(req), req.params.studentId as string);
    res.status(200).json({ success: true, data });
  }),

  childHomework: asyncHandler(async (req: Request, res: Response) => {
    const data = await portalService.childHomework(userId(req), req.params.studentId as string);
    res.status(200).json({ success: true, data });
  }),

  childResults: asyncHandler(async (req: Request, res: Response) => {
    const data = await portalService.childResults(userId(req), req.params.studentId as string);
    res.status(200).json({ success: true, data });
  }),
};
