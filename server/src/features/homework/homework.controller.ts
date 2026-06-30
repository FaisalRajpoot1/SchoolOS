import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { homeworkService } from './homework.service';

export const homeworkController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const homework = await homeworkService.create(
      requireSchoolId(req.user),
      { id: req.user.id, role: req.user.role },
      req.body,
    );
    res.status(201).json({ success: true, data: { homework } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await homeworkService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const homework = await homeworkService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { homework } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const homework = await homeworkService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { homework } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await homeworkService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // ---- Submissions ----
  submissions: asyncHandler(async (req: Request, res: Response) => {
    const data = await homeworkService.submissionsRoster(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    res.status(200).json({ success: true, data });
  }),

  recordSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await homeworkService.recordSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data });
  }),

  gradeSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await homeworkService.gradeSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data });
  }),

  removeSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await homeworkService.removeSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
    );
    res.status(200).json({ success: true, data });
  }),
};
