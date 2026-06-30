import { type AcademicYear, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
} from './academicYears.validation';

/** All operations are scoped to the caller's `schoolId` (tenant isolation). */
export const academicYearsService = {
  async create(schoolId: string, input: CreateAcademicYearInput): Promise<AcademicYear> {
    const existingCount = await prisma.academicYear.count({ where: { schoolId } });
    // The first academic year for a school becomes current by default.
    const shouldBeCurrent = input.isCurrent ?? existingCount === 0;

    try {
      return await prisma.$transaction(async (tx) => {
        if (shouldBeCurrent) {
          await tx.academicYear.updateMany({
            where: { schoolId, isCurrent: true },
            data: { isCurrent: false },
          });
        }
        return tx.academicYear.create({
          data: {
            schoolId,
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            isCurrent: shouldBeCurrent,
          },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('An academic year with this name already exists');
      }
      throw err;
    }
  },

  list(schoolId: string): Promise<AcademicYear[]> {
    return prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
    });
  },

  async getById(schoolId: string, id: string): Promise<AcademicYear> {
    const year = await prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!year) throw ApiError.notFound('Academic year not found');
    return year;
  },

  async update(
    schoolId: string,
    id: string,
    data: UpdateAcademicYearInput,
  ): Promise<AcademicYear> {
    await this.getById(schoolId, id);
    try {
      return await prisma.academicYear.update({ where: { id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('An academic year with this name already exists');
      }
      throw err;
    }
  },

  /** Promotes one academic year to current, demoting any other. */
  async setCurrent(schoolId: string, id: string): Promise<AcademicYear> {
    await this.getById(schoolId, id);
    return prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { schoolId, isCurrent: true, NOT: { id } },
        data: { isCurrent: false },
      });
      return tx.academicYear.update({ where: { id }, data: { isCurrent: true } });
    });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await this.getById(schoolId, id);
    await prisma.academicYear.delete({ where: { id } });
  },
};
