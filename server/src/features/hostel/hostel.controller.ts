import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { hostelService } from './hostel.service';

export const hostelController = {
  // Hostels
  createHostel: asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.createHostel(requireSchoolId(req.user), req.body);
    res.status(201).json({ success: true, data: { hostel } });
  }),
  listHostels: asyncHandler(async (req: Request, res: Response) => {
    const items = await hostelService.listHostels(requireSchoolId(req.user));
    res.status(200).json({ success: true, data: items });
  }),
  getHostel: asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.getHostel(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { hostel } });
  }),
  updateHostel: asyncHandler(async (req: Request, res: Response) => {
    const hostel = await hostelService.updateHostel(
      requireSchoolId(req.user),
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { hostel } });
  }),
  removeHostel: asyncHandler(async (req: Request, res: Response) => {
    await hostelService.removeHostel(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // Rooms
  addRoom: asyncHandler(async (req: Request, res: Response) => {
    const room = await hostelService.addRoom(requireSchoolId(req.user), req.params.id as string, req.body);
    res.status(201).json({ success: true, data: { room } });
  }),
  updateRoom: asyncHandler(async (req: Request, res: Response) => {
    const room = await hostelService.updateRoom(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.roomId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { room } });
  }),
  removeRoom: asyncHandler(async (req: Request, res: Response) => {
    await hostelService.removeRoom(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.roomId as string,
    );
    res.status(204).send();
  }),

  // Allocations
  setAllocation: asyncHandler(async (req: Request, res: Response) => {
    const allocation = await hostelService.setAllocation(
      requireSchoolId(req.user),
      req.params.studentId as string,
      req.body,
    );
    res.status(200).json({ success: true, data: { allocation } });
  }),
  listAllocations: asyncHandler(async (req: Request, res: Response) => {
    const items = await hostelService.listAllocations(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items });
  }),
  removeAllocation: asyncHandler(async (req: Request, res: Response) => {
    await hostelService.removeAllocation(requireSchoolId(req.user), req.params.studentId as string);
    res.status(204).send();
  }),
};
