import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { invoicesService } from './invoices.service';

export const invoicesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoicesService.create(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { invoice } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await invoicesService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoicesService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { invoice } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoicesService.update(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { invoice } });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoicesService.cancel(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { invoice } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await invoicesService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  addPayment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const invoice = await invoicesService.addPayment(
      requireSchoolId(req.user),
      req.user.id,
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { invoice } });
  }),

  removePayment: asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoicesService.removePayment(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.paymentId as string,
    );
    res.status(200).json({ success: true, data: { invoice } });
  }),
};
