import { Prisma, type Subject } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type { CreateSubjectInput, UpdateSubjectInput } from './subjects.validation';

const duplicate = (err: unknown): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict('A subject with this name or code already exists')
    : null;

/** Subject catalog, scoped to the caller's school. */
export const subjectsService = {
  async create(schoolId: string, input: CreateSubjectInput): Promise<Subject> {
    try {
      return await prisma.subject.create({
        data: { schoolId, name: input.name, code: input.code.toUpperCase() },
      });
    } catch (err) {
      throw duplicate(err) ?? err;
    }
  },

  list(schoolId: string): Promise<Subject[]> {
    return prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  },

  async getById(schoolId: string, id: string): Promise<Subject> {
    const subject = await prisma.subject.findFirst({ where: { id, schoolId } });
    if (!subject) throw ApiError.notFound('Subject not found');
    return subject;
  },

  async update(schoolId: string, id: string, input: UpdateSubjectInput): Promise<Subject> {
    await this.getById(schoolId, id);
    try {
      return await prisma.subject.update({
        where: { id },
        data: { ...input, ...(input.code ? { code: input.code.toUpperCase() } : {}) },
      });
    } catch (err) {
      throw duplicate(err) ?? err;
    }
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await this.getById(schoolId, id);
    await prisma.subject.delete({ where: { id } });
  },
};
