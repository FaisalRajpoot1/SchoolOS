import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { assignmentsService } from './assignments.service';

export const assignmentsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const assignment = await assignmentsService.create(
      requireSchoolId(req.user),
      { id: req.user.id, role: req.user.role },
      req.body,
    );
    res.status(201).json({ success: true, data: { assignment } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await assignmentsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { assignment } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { assignment } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await assignmentsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  submissions: asyncHandler(async (req: Request, res: Response) => {
    const data = await assignmentsService.submissionsRoster(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    res.status(200).json({ success: true, data });
  }),

  recordSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await assignmentsService.recordSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data });
  }),

  gradeSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await assignmentsService.gradeSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data });
  }),

  removeSubmission: asyncHandler(async (req: Request, res: Response) => {
    const data = await assignmentsService.removeSubmission(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.studentId as string,
    );
    res.status(200).json({ success: true, data });
  }),
};
