import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { inventoryService } from './inventory.service';

export const inventoryController = {
  // Suppliers
  createSupplier: asyncHandler(async (req: Request, res: Response) => {
    const supplier = await inventoryService.createSupplier(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { supplier } });
  }),
  listSuppliers: asyncHandler(async (req: Request, res: Response) => {
    const items = await inventoryService.listSuppliers(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),
  updateSupplier: asyncHandler(async (req: Request, res: Response) => {
    const supplier = await inventoryService.updateSupplier(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { supplier } });
  }),
  removeSupplier: asyncHandler(async (req: Request, res: Response) => {
    await inventoryService.removeSupplier(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Items
  createItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.createItem(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { item } });
  }),
  listItems: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await inventoryService.listItems(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),
  getItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.getItem(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { item } });
  }),
  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.updateItem(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { item } });
  }),
  removeItem: asyncHandler(async (req: Request, res: Response) => {
    await inventoryService.removeItem(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Stock movements
  recordTransaction: asyncHandler(async (req: Request, res: Response) => {
    const item = await inventoryService.recordTransaction(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { item } });
  }),
};
