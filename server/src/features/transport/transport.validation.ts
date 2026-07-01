import { z } from 'zod';

// ---- Vehicles ----
export const createVehicleSchema = z
  .object({
    registrationNo: z.string().trim().min(1).max(30),
    model: z.string().trim().max(80).nullish(),
    capacity: z.coerce.number().int().min(0).max(200).default(0),
    driverName: z.string().trim().max(80).nullish(),
    driverPhone: z.string().trim().max(30).nullish(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateVehicleSchema = z
  .object({
    registrationNo: z.string().trim().min(1).max(30).optional(),
    model: z.string().trim().max(80).nullish(),
    capacity: z.coerce.number().int().min(0).max(200).optional(),
    driverName: z.string().trim().max(80).nullish(),
    driverPhone: z.string().trim().max(30).nullish(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const vehicleIdParamSchema = z.object({ id: z.string().uuid() });

// ---- Routes & stops ----
const stopInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    sequence: z.coerce.number().int().min(0).max(1000).default(0),
    pickupMinute: z.coerce.number().int().min(0).max(1440).nullish(),
  })
  .strict();

export const createRouteSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(300).nullish(),
    fee: z.coerce.number().int().min(0).max(100_000_000).default(0),
    vehicleId: z.string().uuid().nullish(),
    stops: z.array(stopInputSchema).max(50).optional(),
  })
  .strict();

export const updateRouteSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(300).nullish(),
    fee: z.coerce.number().int().min(0).max(100_000_000).optional(),
    vehicleId: z.string().uuid().nullish(),
  })
  .strict();

export const createStopSchema = stopInputSchema;

export const routeIdParamSchema = z.object({ id: z.string().uuid() });
export const stopParamSchema = z.object({
  id: z.string().uuid(),
  stopId: z.string().uuid(),
});

// ---- Allocations ----
export const setAllocationSchema = z
  .object({
    routeId: z.string().uuid(),
    stopId: z.string().uuid().nullish(),
  })
  .strict();

export const listAllocationsSchema = z.object({ routeId: z.string().uuid().optional() });
export const studentParamSchema = z.object({ studentId: z.string().uuid() });

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type CreateStopInput = z.infer<typeof createStopSchema>;
export type SetAllocationInput = z.infer<typeof setAllocationSchema>;
export type ListAllocationsQuery = z.infer<typeof listAllocationsSchema>;
