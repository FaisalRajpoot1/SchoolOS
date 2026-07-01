import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { transportService } from './transport.service';

export const transportController = {
  // Vehicles
  createVehicle: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await transportService.createVehicle(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { vehicle } });
  }),
  listVehicles: asyncHandler(async (req: Request, res: Response) => {
    const items = await transportService.listVehicles(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),
  updateVehicle: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await transportService.updateVehicle(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { vehicle } });
  }),
  removeVehicle: asyncHandler(async (req: Request, res: Response) => {
    await transportService.removeVehicle(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Routes
  createRoute: asyncHandler(async (req: Request, res: Response) => {
    const route = await transportService.createRoute(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { route } });
  }),
  listRoutes: asyncHandler(async (req: Request, res: Response) => {
    const items = await transportService.listRoutes(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),
  getRoute: asyncHandler(async (req: Request, res: Response) => {
    const route = await transportService.getRoute(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { route } });
  }),
  updateRoute: asyncHandler(async (req: Request, res: Response) => {
    const route = await transportService.updateRoute(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { route } });
  }),
  removeRoute: asyncHandler(async (req: Request, res: Response) => {
    await transportService.removeRoute(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Stops
  addStop: asyncHandler(async (req: Request, res: Response) => {
    const stop = await transportService.addStop(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { stop } });
  }),
  removeStop: asyncHandler(async (req: Request, res: Response) => {
    await transportService.removeStop(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.stopId as string,
    );
    res.status(204).send();
  }),

  // Allocations
  setAllocation: asyncHandler(async (req: Request, res: Response) => {
    const allocation = await transportService.setAllocation(
      requireSchoolId(req.user),
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { allocation } });
  }),
  listAllocations: asyncHandler(async (req: Request, res: Response) => {
    const items = await transportService.listAllocations(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items });
  }),
  removeAllocation: asyncHandler(async (req: Request, res: Response) => {
    await transportService.removeAllocation(requireSchoolId(req.user), req.params.studentId as string);
    res.status(204).send();
  }),
};
