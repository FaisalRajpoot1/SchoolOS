import { Prisma, type RouteStop, type TransportRoute, type Vehicle } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateRouteInput,
  CreateStopInput,
  CreateVehicleInput,
  ListAllocationsQuery,
  SetAllocationInput,
  UpdateRouteInput,
  UpdateVehicleInput,
} from './transport.validation';

const duplicateVehicle = (err: unknown): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict('A vehicle with this registration number already exists')
    : null;

const assertVehicle = async (schoolId: string, id: string): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, schoolId } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return vehicle;
};

const assertRoute = async (schoolId: string, id: string): Promise<TransportRoute> => {
  const route = await prisma.transportRoute.findFirst({ where: { id, schoolId } });
  if (!route) throw ApiError.notFound('Route not found');
  return route;
};

const routeDetailInclude = {
  vehicle: { select: { id: true, registrationNo: true, model: true } },
  stops: { orderBy: { sequence: 'asc' } },
  allocations: {
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      stop: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TransportRouteInclude;

export const transportService = {
  // ---- Vehicles ----
  async createVehicle(schoolId: string, input: CreateVehicleInput): Promise<Vehicle> {
    try {
      return await prisma.vehicle.create({ data: { schoolId, ...input } });
    } catch (err) {
      throw duplicateVehicle(err) ?? err;
    }
  },

  listVehicles(schoolId: string) {
    return prisma.vehicle.findMany({
      where: { schoolId },
      orderBy: { registrationNo: 'asc' },
      include: { _count: { select: { routes: true } } },
    });
  },

  async updateVehicle(schoolId: string, id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    await assertVehicle(schoolId, id);
    try {
      return await prisma.vehicle.update({ where: { id }, data: input });
    } catch (err) {
      throw duplicateVehicle(err) ?? err;
    }
  },

  async removeVehicle(schoolId: string, id: string): Promise<void> {
    await assertVehicle(schoolId, id);
    await prisma.vehicle.delete({ where: { id } });
  },

  // ---- Routes ----
  async createRoute(schoolId: string, input: CreateRouteInput) {
    if (input.vehicleId) await assertVehicle(schoolId, input.vehicleId);
    return prisma.transportRoute.create({
      data: {
        schoolId,
        name: input.name,
        description: input.description ?? null,
        fee: input.fee,
        vehicleId: input.vehicleId ?? null,
        stops: input.stops?.length
          ? {
              create: input.stops.map((s) => ({
                name: s.name,
                sequence: s.sequence,
                pickupMinute: s.pickupMinute ?? null,
              })),
            }
          : undefined,
      },
      include: routeDetailInclude,
    });
  },

  listRoutes(schoolId: string) {
    return prisma.transportRoute.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: {
        vehicle: { select: { id: true, registrationNo: true } },
        _count: { select: { stops: true, allocations: true } },
      },
    });
  },

  async getRoute(schoolId: string, id: string) {
    const route = await prisma.transportRoute.findFirst({
      where: { id, schoolId },
      include: routeDetailInclude,
    });
    if (!route) throw ApiError.notFound('Route not found');
    return route;
  },

  async updateRoute(schoolId: string, id: string, input: UpdateRouteInput) {
    await assertRoute(schoolId, id);
    if (input.vehicleId) await assertVehicle(schoolId, input.vehicleId);
    await prisma.transportRoute.update({ where: { id }, data: input });
    return this.getRoute(schoolId, id);
  },

  async removeRoute(schoolId: string, id: string): Promise<void> {
    await assertRoute(schoolId, id);
    await prisma.transportRoute.delete({ where: { id } });
  },

  // ---- Stops ----
  async addStop(schoolId: string, routeId: string, input: CreateStopInput): Promise<RouteStop> {
    await assertRoute(schoolId, routeId);
    return prisma.routeStop.create({
      data: {
        routeId,
        name: input.name,
        sequence: input.sequence,
        pickupMinute: input.pickupMinute ?? null,
      },
    });
  },

  async removeStop(schoolId: string, routeId: string, stopId: string): Promise<void> {
    await assertRoute(schoolId, routeId);
    const stop = await prisma.routeStop.findFirst({ where: { id: stopId, routeId } });
    if (!stop) throw ApiError.notFound('Stop not found');
    await prisma.routeStop.delete({ where: { id: stopId } });
  },

  // ---- Allocations ----
  /** Assigns (or reassigns) a student to a route + optional stop. */
  async setAllocation(schoolId: string, studentId: string, input: SetAllocationInput) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Invalid student for this school');
    await assertRoute(schoolId, input.routeId);

    if (input.stopId) {
      const stop = await prisma.routeStop.findFirst({
        where: { id: input.stopId, routeId: input.routeId },
      });
      if (!stop) throw ApiError.badRequest('Stop does not belong to the selected route');
    }

    return prisma.transportAllocation.upsert({
      where: { studentId },
      update: { routeId: input.routeId, stopId: input.stopId ?? null },
      create: { schoolId, studentId, routeId: input.routeId, stopId: input.stopId ?? null },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
      },
    });
  },

  listAllocations(schoolId: string, query: ListAllocationsQuery) {
    return prisma.transportAllocation.findMany({
      where: { schoolId, ...(query.routeId ? { routeId: query.routeId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
      },
    });
  },

  async removeAllocation(schoolId: string, studentId: string): Promise<void> {
    await prisma.transportAllocation.deleteMany({ where: { schoolId, studentId } });
  },
};
