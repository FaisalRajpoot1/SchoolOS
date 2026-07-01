import { type Hostel, type HostelRoom, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateHostelInput,
  CreateRoomInput,
  ListAllocationsQuery,
  SetAllocationInput,
  UpdateHostelInput,
  UpdateRoomInput,
} from './hostel.validation';

const duplicateRoom = (err: unknown): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict('A room with this number already exists in this hostel')
    : null;

const assertHostel = async (schoolId: string, id: string): Promise<Hostel> => {
  const hostel = await prisma.hostel.findFirst({ where: { id, schoolId } });
  if (!hostel) throw ApiError.notFound('Hostel not found');
  return hostel;
};

/** Loads a room within the tenant (via its hostel), including capacity. */
const assertRoom = async (schoolId: string, roomId: string): Promise<HostelRoom> => {
  const room = await prisma.hostelRoom.findFirst({
    where: { id: roomId, hostel: { schoolId } },
  });
  if (!room) throw ApiError.badRequest('Invalid room for this school');
  return room;
};

const allocationInclude = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  room: { select: { id: true, roomNumber: true, hostel: { select: { id: true, name: true } } } },
} satisfies Prisma.HostelAllocationInclude;

export const hostelService = {
  // ---- Hostels ----
  async createHostel(schoolId: string, input: CreateHostelInput): Promise<Hostel> {
    return prisma.hostel.create({ data: { schoolId, ...input } });
  },

  async listHostels(schoolId: string) {
    const hostels = await prisma.hostel.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: { rooms: { select: { capacity: true, _count: { select: { allocations: true } } } } },
    });
    return hostels.map(({ rooms, ...hostel }) => ({
      ...hostel,
      roomCount: rooms.length,
      totalBeds: rooms.reduce((acc, r) => acc + r.capacity, 0),
      occupied: rooms.reduce((acc, r) => acc + r._count.allocations, 0),
    }));
  },

  async getHostel(schoolId: string, id: string) {
    const hostel = await prisma.hostel.findFirst({
      where: { id, schoolId },
      include: {
        rooms: {
          orderBy: { roomNumber: 'asc' },
          include: {
            allocations: {
              include: {
                student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
              },
            },
          },
        },
      },
    });
    if (!hostel) throw ApiError.notFound('Hostel not found');
    return hostel;
  },

  async updateHostel(schoolId: string, id: string, input: UpdateHostelInput): Promise<Hostel> {
    await assertHostel(schoolId, id);
    return prisma.hostel.update({ where: { id }, data: input });
  },

  async removeHostel(schoolId: string, id: string): Promise<void> {
    await assertHostel(schoolId, id);
    await prisma.hostel.delete({ where: { id } });
  },

  // ---- Rooms ----
  async addRoom(schoolId: string, hostelId: string, input: CreateRoomInput): Promise<HostelRoom> {
    await assertHostel(schoolId, hostelId);
    try {
      return await prisma.hostelRoom.create({ data: { hostelId, ...input } });
    } catch (err) {
      throw duplicateRoom(err) ?? err;
    }
  },

  async updateRoom(
    schoolId: string,
    hostelId: string,
    roomId: string,
    input: UpdateRoomInput,
  ): Promise<HostelRoom> {
    await assertHostel(schoolId, hostelId);
    const room = await prisma.hostelRoom.findFirst({ where: { id: roomId, hostelId } });
    if (!room) throw ApiError.notFound('Room not found');

    if (input.capacity !== undefined) {
      const occupied = await prisma.hostelAllocation.count({ where: { roomId } });
      if (input.capacity < occupied) {
        throw ApiError.badRequest(`Capacity cannot be below current occupancy (${occupied})`);
      }
    }
    try {
      return await prisma.hostelRoom.update({ where: { id: roomId }, data: input });
    } catch (err) {
      throw duplicateRoom(err) ?? err;
    }
  },

  async removeRoom(schoolId: string, hostelId: string, roomId: string): Promise<void> {
    await assertHostel(schoolId, hostelId);
    const room = await prisma.hostelRoom.findFirst({ where: { id: roomId, hostelId } });
    if (!room) throw ApiError.notFound('Room not found');
    await prisma.hostelRoom.delete({ where: { id: roomId } });
  },

  // ---- Allocations ----
  /** Assigns (or reassigns) a student to a room, guarding room capacity. */
  async setAllocation(schoolId: string, studentId: string, input: SetAllocationInput) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) throw ApiError.badRequest('Invalid student for this school');
    const room = await assertRoom(schoolId, input.roomId);

    const occupied = await prisma.hostelAllocation.count({
      where: { roomId: input.roomId, NOT: { studentId } },
    });
    if (occupied >= room.capacity) throw ApiError.conflict('This room is full');

    return prisma.hostelAllocation.upsert({
      where: { studentId },
      update: { roomId: input.roomId, bedLabel: input.bedLabel ?? null },
      create: { schoolId, studentId, roomId: input.roomId, bedLabel: input.bedLabel ?? null },
      include: allocationInclude,
    });
  },

  listAllocations(schoolId: string, query: ListAllocationsQuery) {
    return prisma.hostelAllocation.findMany({
      where: {
        schoolId,
        ...(query.roomId ? { roomId: query.roomId } : {}),
        ...(query.hostelId ? { room: { hostelId: query.hostelId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: allocationInclude,
    });
  },

  async removeAllocation(schoolId: string, studentId: string): Promise<void> {
    await prisma.hostelAllocation.deleteMany({ where: { schoolId, studentId } });
  },
};
