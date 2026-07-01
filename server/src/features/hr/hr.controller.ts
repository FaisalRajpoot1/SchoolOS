import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { hrService } from './hr.service';

export const hrController = {
  // Employees
  createEmployee: asyncHandler(async (req: Request, res: Response) => {
    const employee = await hrService.createEmployee(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { employee } });
  }),
  listEmployees: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await hrService.listEmployees(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),
  getEmployee: asyncHandler(async (req: Request, res: Response) => {
    const employee = await hrService.getEmployee(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { employee } });
  }),
  updateEmployee: asyncHandler(async (req: Request, res: Response) => {
    const employee = await hrService.updateEmployee(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { employee } });
  }),
  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const employee = await hrService.setStatus(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body.status,
    );
    res.status(200).json({ success: true, data: { employee } });
  }),
  removeEmployee: asyncHandler(async (req: Request, res: Response) => {
    await hrService.removeEmployee(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Leave
  applyLeave: asyncHandler(async (req: Request, res: Response) => {
    const leave = await hrService.applyLeave(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { leave } });
  }),
  listLeave: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await hrService.listLeave(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),
  reviewLeave: asyncHandler(async (req: Request, res: Response) => {
    const leave = await hrService.reviewLeave(
      requireSchoolId(req.user),
      req.params.leaveId as string,
      req.body.status,
    );
    res.status(200).json({ success: true, data: { leave } });
  }),
};
