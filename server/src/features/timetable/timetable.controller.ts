import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { sendPdf } from '@/utils/pdf';
import { timetableService } from './timetable.service';

export const timetableController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const slot = await timetableService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { slot } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const slots = await timetableService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: slots });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const slot = await timetableService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { slot } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await timetableService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  workload: asyncHandler(async (req: Request, res: Response) => {
    const rows = await timetableService.workload(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: rows });
  }),

  exportPdf: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename } = await timetableService.renderPdf(
      requireSchoolId(req.user),
      req.query as never,
    );
    sendPdf(res, buffer, filename);
  }),
};
