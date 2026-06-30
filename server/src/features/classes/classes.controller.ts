import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { classesService } from './classes.service';

export const classesController = {
  // ---- Classes ----
  create: asyncHandler(async (req: Request, res: Response) => {
    const created = await classesService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { class: created } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await classesService.list(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const detail = await classesService.getById(
      requireSchoolId(req.user),
      req.params.classId as string,
    );
    res.status(200).json({ success: true, data: { class: detail } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const updated = await classesService.update(
      requireSchoolId(req.user),
      req.params.classId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { class: updated } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await classesService.remove(requireSchoolId(req.user), req.params.classId as string);
    res.status(204).send();
  }),

  // ---- Sections ----
  createSection: asyncHandler(async (req: Request, res: Response) => {
    const section = await classesService.createSection(
      requireSchoolId(req.user),
      req.params.classId as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { section } });
  }),

  updateSection: asyncHandler(async (req: Request, res: Response) => {
    const section = await classesService.updateSection(
      requireSchoolId(req.user),
      req.params.classId as string,
      req.params.sectionId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { section } });
  }),

  removeSection: asyncHandler(async (req: Request, res: Response) => {
    await classesService.removeSection(
      requireSchoolId(req.user),
      req.params.classId as string,
      req.params.sectionId as string,
    );
    res.status(204).send();
  }),

  // ---- Offered subjects ----
  setSubjects: asyncHandler(async (req: Request, res: Response) => {
    const subjects = await classesService.setSubjects(
      requireSchoolId(req.user),
      req.params.classId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: subjects });
  }),
};
