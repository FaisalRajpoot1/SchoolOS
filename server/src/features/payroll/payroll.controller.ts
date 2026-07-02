import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { sendPdf } from '@/utils/pdf';
import { payrollService } from './payroll.service';

export const payrollController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const payslip = await payrollService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { payslip } });
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const result = await payrollService.generate(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: result });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await payrollService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const payslip = await payrollService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { payslip } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const payslip = await payrollService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { payslip } });
  }),

  pdf: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename } = await payrollService.renderPdf(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    sendPdf(res, buffer, filename);
  }),

  pay: asyncHandler(async (req: Request, res: Response) => {
    const payslip = await payrollService.pay(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { payslip } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await payrollService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
