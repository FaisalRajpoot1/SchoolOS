import { type Parent, Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword } from '@/utils/password';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  CreateParentInput,
  LinkChildInput,
  ListParentsQuery,
  UpdateParentInput,
} from './parents.validation';

const childInclude = {
  children: {
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ParentInclude;

const detailInclude = {
  user: { select: { id: true, email: true, isActive: true } },
  ...childInclude,
} satisfies Prisma.ParentInclude;

/** Ensures every id refers to a student in this school, or throws. */
const assertStudentsInSchool = async (schoolId: string, studentIds: string[]): Promise<void> => {
  if (studentIds.length === 0) return;
  const count = await prisma.student.count({ where: { schoolId, id: { in: studentIds } } });
  if (count !== studentIds.length) {
    throw ApiError.badRequest('One or more students do not belong to this school');
  }
};

const assertParent = async (schoolId: string, id: string): Promise<Parent> => {
  const parent = await prisma.parent.findFirst({ where: { id, schoolId } });
  if (!parent) throw ApiError.notFound('Parent not found');
  return parent;
};

export const parentsService = {
  /** Creates a parent record plus its linked PARENT login and child links. */
  async create(schoolId: string, input: CreateParentInput) {
    const studentIds = [...new Set(input.studentIds ?? [])];
    await assertStudentsInSchool(schoolId, studentIds);
    const passwordHash = await hashPassword(input.password);

    try {
      const parent = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            role: UserRole.PARENT,
            schoolId,
          },
        });
        return tx.parent.create({
          data: {
            schoolId,
            userId: user.id,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            occupation: input.occupation,
            address: input.address,
            children: { create: studentIds.map((studentId) => ({ studentId })) },
          },
          include: detailInclude,
        });
      });
      return parent;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A user with this email already exists');
      }
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListParentsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.ParentWhereInput = {
      schoolId,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.parent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: { _count: { select: { children: true } } },
      }),
      prisma.parent.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const parent = await prisma.parent.findFirst({ where: { id, schoolId }, include: detailInclude });
    if (!parent) throw ApiError.notFound('Parent not found');
    return parent;
  },

  async update(schoolId: string, id: string, input: UpdateParentInput) {
    const existing = await assertParent(schoolId, id);
    await prisma.$transaction(async (tx) => {
      if (input.firstName || input.lastName) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(input.firstName ? { firstName: input.firstName } : {}),
            ...(input.lastName ? { lastName: input.lastName } : {}),
          },
        });
      }
      await tx.parent.update({ where: { id }, data: input });
    });
    return this.getById(schoolId, id);
  },

  /** Removes the parent (cascades the linked login account). */
  async remove(schoolId: string, id: string): Promise<void> {
    const parent = await assertParent(schoolId, id);
    // Deleting the user cascades to the parent + child links.
    await prisma.user.delete({ where: { id: parent.userId } });
  },

  async linkChild(schoolId: string, id: string, input: LinkChildInput) {
    await assertParent(schoolId, id);
    await assertStudentsInSchool(schoolId, [input.studentId]);
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: id, studentId: input.studentId } },
      update: { relation: input.relation ?? null },
      create: { parentId: id, studentId: input.studentId, relation: input.relation ?? null },
    });
    return this.getById(schoolId, id);
  },

  async unlinkChild(schoolId: string, id: string, studentId: string) {
    await assertParent(schoolId, id);
    await prisma.parentStudent.deleteMany({ where: { parentId: id, studentId } });
    return this.getById(schoolId, id);
  },
};
