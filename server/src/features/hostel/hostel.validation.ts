import { z } from 'zod';

const hostelType = z.enum(['BOYS', 'GIRLS', 'MIXED']);

// ---- Hostels ----
export const createHostelSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: hostelType.default('MIXED'),
    wardenName: z.string().trim().max(80).nullish(),
    wardenPhone: z.string().trim().max(30).nullish(),
    monthlyFee: z.coerce.number().int().min(0).max(100_000_000).default(0),
  })
  .strict();

export const updateHostelSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    type: hostelType.optional(),
    wardenName: z.string().trim().max(80).nullish(),
    wardenPhone: z.string().trim().max(30).nullish(),
    monthlyFee: z.coerce.number().int().min(0).max(100_000_000).optional(),
  })
  .strict();

export const hostelIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Rooms ----
export const createRoomSchema = z
  .object({
    roomNumber: z.string().trim().min(1).max(20),
    floor: z.string().trim().max(20).nullish(),
    capacity: z.coerce.number().int().min(1).max(50).default(1),
  })
  .strict();

export const updateRoomSchema = z
  .object({
    roomNumber: z.string().trim().min(1).max(20).optional(),
    floor: z.string().trim().max(20).nullish(),
    capacity: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const roomParamSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
});

// ---- Allocations ----
export const setAllocationSchema = z
  .object({
    roomId: z.string().uuid(),
    bedLabel: z.string().trim().max(20).nullish(),
  })
  .strict();

export const listAllocationsSchema = z.object({
  hostelId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

export const studentParamSchema = z.object({ studentId: z.string().uuid() });

export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type SetAllocationInput = z.infer<typeof setAllocationSchema>;
export type ListAllocationsQuery = z.infer<typeof listAllocationsSchema>;
