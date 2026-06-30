import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { examsService } from './exams.service';

export const examsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { exam } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await examsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { exam } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examsService.update(requireSchoolId(req.user), req.params.id as string, req.body);
    res.status(200).json({ success: true, data: { exam } });
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examsService.setPublished(requireSchoolId(req.user), req.params.id as string, true);
    res.status(200).json({ success: true, data: { exam } });
  }),

  unpublish: asyncHandler(async (req: Request, res: Response) => {
    const exam = await examsService.setPublished(requireSchoolId(req.user), req.params.id as string, false);
    res.status(200).json({ success: true, data: { exam } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await examsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  updateExamSubject: asyncHandler(async (req: Request, res: Response) => {
    const examSubject = await examsService.updateExamSubject(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.examSubjectId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { examSubject } });
  }),

  marksRoster: asyncHandler(async (req: Request, res: Response) => {
    const data = await examsService.marksRoster(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.examSubjectId as string,
    );
    res.status(200).json({ success: true, data });
  }),

  bulkMarks: asyncHandler(async (req: Request, res: Response) => {
    const data = await examsService.bulkMarks(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.examSubjectId as string,
      req.body,
    );
    res.status(200).json({ success: true, data });
  }),

  results: asyncHandler(async (req: Request, res: Response) => {
    const data = await examsService.results(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data });
  }),
};
