import { type InfirmaryVisit, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { bmi } from './bmi';
import type { CreateVisitInput, ListVisitsQuery, UpsertProfileInput } from './medical.validation';

const visitInclude = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InfirmaryVisitInclude;

const assertStudent = async (schoolId: string, studentId: string): Promise<void> => {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw ApiError.notFound('Student not found');
};

const assertVisit = async (schoolId: string, id: string): Promise<InfirmaryVisit> => {
  const visit = await prisma.infirmaryVisit.findFirst({ where: { id, schoolId } });
  if (!visit) throw ApiError.notFound('Infirmary visit not found');
  return visit;
};

/** Attaches a derived `bmi` field to a profile (null profile stays null). */
const withBmi = <T extends { heightCm: number | null; weightKg: number | null }>(
  profile: T | null,
): (T & { bmi: number | null }) | null =>
  profile ? { ...profile, bmi: bmi(profile.heightCm, profile.weightKg) } : null;

export const medicalService = {
  async getProfile(schoolId: string, studentId: string) {
    await assertStudent(schoolId, studentId);
    const profile = await prisma.medicalProfile.findUnique({ where: { studentId } });
    return withBmi(profile);
  },

  async upsertProfile(schoolId: string, studentId: string, input: UpsertProfileInput) {
    await assertStudent(schoolId, studentId);
    const data = {
      bloodGroup: input.bloodGroup ?? null,
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg ?? null,
      allergies: input.allergies ?? null,
      conditions: input.conditions ?? null,
      medications: input.medications ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      notes: input.notes ?? null,
    };
    const profile = await prisma.medicalProfile.upsert({
      where: { studentId },
      create: { schoolId, studentId, ...data },
      update: data,
    });
    return withBmi(profile);
  },

  async listVisits(
    schoolId: string,
    query: ListVisitsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    if (query.studentId) await assertStudent(schoolId, query.studentId);
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.InfirmaryVisitWhereInput = {
      schoolId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.outcome ? { outcome: query.outcome } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.infirmaryVisit.findMany({
        where,
        skip,
        take,
        orderBy: { visitedOn: 'desc' },
        include: visitInclude,
      }),
      prisma.infirmaryVisit.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getVisit(schoolId: string, id: string) {
    const visit = await prisma.infirmaryVisit.findFirst({
      where: { id, schoolId },
      include: visitInclude,
    });
    if (!visit) throw ApiError.notFound('Infirmary visit not found');
    return visit;
  },

  async createVisit(schoolId: string, recordedById: string, input: CreateVisitInput) {
    await assertStudent(schoolId, input.studentId);
    return prisma.infirmaryVisit.create({
      data: {
        schoolId,
        studentId: input.studentId,
        recordedById,
        reason: input.reason,
        treatment: input.treatment ?? null,
        temperatureC: input.temperatureC ?? null,
        outcome: input.outcome,
        visitedOn: input.visitedOn ?? new Date(),
      },
      include: visitInclude,
    });
  },

  async removeVisit(schoolId: string, id: string): Promise<void> {
    await assertVisit(schoolId, id);
    await prisma.infirmaryVisit.delete({ where: { id } });
  },
};
