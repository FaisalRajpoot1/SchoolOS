import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { studentsService } from './students.service';

export const studentsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentsService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { student } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await studentsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { student } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentsService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { student } });
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const student = await studentsService.setStatus(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body.status,
    );
    res.status(200).json({ success: true, data: { student } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await studentsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // ---- Guardians ----
  addGuardian: asyncHandler(async (req: Request, res: Response) => {
    const guardian = await studentsService.addGuardian(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { guardian } });
  }),

  updateGuardian: asyncHandler(async (req: Request, res: Response) => {
    const guardian = await studentsService.updateGuardian(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.guardianId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { guardian } });
  }),

  removeGuardian: asyncHandler(async (req: Request, res: Response) => {
    await studentsService.removeGuardian(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.guardianId as string,
    );
    res.status(204).send();
  }),

  bulkImport: asyncHandler(async (req: Request, res: Response) => {
    const result = await studentsService.bulkImport(requireSchoolId(req.user), req.body);
    res.status(200).json({ success: true, data: result });
  }),

  setPortalAccess: asyncHandler(async (req: Request, res: Response) => {
    const result = await studentsService.setPortalAccess(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  }),
};
