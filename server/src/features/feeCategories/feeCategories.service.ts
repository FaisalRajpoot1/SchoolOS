import { type FeeCategory, Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateFeeCategoryInput,
  UpdateFeeCategoryInput,
} from './feeCategories.validation';

const duplicate = (err: unknown): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict('A fee category with this name already exists')
    : null;

export const feeCategoriesService = {
  async create(schoolId: string, input: CreateFeeCategoryInput): Promise<FeeCategory> {
    try {
      return await prisma.feeCategory.create({ data: { schoolId, ...input } });
    } catch (err) {
      throw duplicate(err) ?? err;
    }
  },

  list(schoolId: string): Promise<FeeCategory[]> {
    return prisma.feeCategory.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  },

  async getById(schoolId: string, id: string): Promise<FeeCategory> {
    const category = await prisma.feeCategory.findFirst({ where: { id, schoolId } });
    if (!category) throw ApiError.notFound('Fee category not found');
    return category;
  },

  async update(schoolId: string, id: string, input: UpdateFeeCategoryInput): Promise<FeeCategory> {
    await this.getById(schoolId, id);
    try {
      return await prisma.feeCategory.update({ where: { id }, data: input });
    } catch (err) {
      throw duplicate(err) ?? err;
    }
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await this.getById(schoolId, id);
    await prisma.feeCategory.delete({ where: { id } });
  },
};
