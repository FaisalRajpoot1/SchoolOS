import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError } from '@/utils/ApiError';
import { studentPortalService } from './studentPortal.service';

const requireUserId = (req: Request): string => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
};

export const studentPortalController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentPortalService.me(requireUserId(req));
    res.status(200).json({ success: true, data: { student } });
  }),

  attendance: asyncHandler(async (req: Request, res: Response) => {
    const data = await studentPortalService.attendance(requireUserId(req), req.query as never);
    res.status(200).json({ success: true, data });
  }),

  invoices: asyncHandler(async (req: Request, res: Response) => {
    const data = await studentPortalService.invoices(requireUserId(req));
    res.status(200).json({ success: true, data });
  }),

  homework: asyncHandler(async (req: Request, res: Response) => {
    const data = await studentPortalService.homework(requireUserId(req));
    res.status(200).json({ success: true, data });
  }),

  assignments: asyncHandler(async (req: Request, res: Response) => {
    const data = await studentPortalService.assignments(requireUserId(req));
    res.status(200).json({ success: true, data });
  }),

  results: asyncHandler(async (req: Request, res: Response) => {
    const data = await studentPortalService.results(requireUserId(req));
    res.status(200).json({ success: true, data });
  }),
};
