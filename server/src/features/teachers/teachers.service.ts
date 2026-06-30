import { Prisma, type Teacher, UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword } from '@/utils/password';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateTeacherInput,
  ListTeachersQuery,
  UpdateTeacherInput,
} from './teachers.validation';

const teacherDetailInclude = {
  user: { select: { id: true, email: true, isActive: true } },
  classSections: {
    select: { id: true, name: true, class: { select: { id: true, name: true } } },
  },
  subjectAssignments: {
    select: {
      id: true,
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.TeacherInclude;

const nextEmployeeNo = async (schoolId: string): Promise<string> => {
  const count = await prisma.teacher.count({ where: { schoolId } });
  return `EMP-${String(count + 1).padStart(5, '0')}`;
};

export const teachersService = {
  /** Creates a teacher record plus its linked TEACHER login account atomically. */
  async create(schoolId: string, input: CreateTeacherInput): Promise<Teacher> {
    const employeeNo = input.employeeNo ?? (await nextEmployeeNo(schoolId));
    const passwordHash = await hashPassword(input.password);

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            role: UserRole.TEACHER,
            schoolId,
          },
        });

        return tx.teacher.create({
          data: {
            schoolId,
            userId: user.id,
            employeeNo,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            gender: input.gender,
            dateOfBirth: input.dateOfBirth,
            qualification: input.qualification,
            experienceYears: input.experienceYears,
            salary: input.salary,
            joiningDate: input.joiningDate,
          },
          include: teacherDetailInclude,
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A teacher with this email or employee number already exists');
      }
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListTeachersQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);

    const where: Prisma.TeacherWhereInput = {
      schoolId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { employeeNo: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.teacher.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: { _count: { select: { classSections: true, subjectAssignments: true } } },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId },
      include: teacherDetailInclude,
    });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    return teacher;
  },

  async update(schoolId: string, id: string, input: UpdateTeacherInput): Promise<Teacher> {
    const existing = await this.getById(schoolId, id);

    return prisma.$transaction(async (tx) => {
      // Keep the linked login account's name in sync.
      if (existing.userId && (input.firstName || input.lastName)) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(input.firstName ? { firstName: input.firstName } : {}),
            ...(input.lastName ? { lastName: input.lastName } : {}),
          },
        });
      }
      return tx.teacher.update({
        where: { id },
        data: input,
        include: teacherDetailInclude,
      });
    });
  },

  async setStatus(schoolId: string, id: string, status: Teacher['status']): Promise<Teacher> {
    const existing = await this.getById(schoolId, id);
    return prisma.$transaction(async (tx) => {
      // Disable login when the teacher is not active.
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: status === 'ACTIVE' },
        });
      }
      return tx.teacher.update({ where: { id }, data: { status } });
    });
  },

  /** Deletes the teacher and its linked login account. */
  async remove(schoolId: string, id: string): Promise<void> {
    const existing = await this.getById(schoolId, id);
    await prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } });
      if (existing.userId) {
        await tx.user.delete({ where: { id: existing.userId } });
      }
    });
  },
};
