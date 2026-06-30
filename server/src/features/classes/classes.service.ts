import { type Class, Prisma, type Section, type Subject } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateClassInput,
  CreateSectionInput,
  SetClassSubjectsInput,
  UpdateClassInput,
  UpdateSectionInput,
} from './classes.validation';

const onDuplicate = (err: unknown, message: string): ApiError | null =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    ? ApiError.conflict(message)
    : null;

/** Loads a class within the tenant or throws 404. */
const assertClass = async (schoolId: string, classId: string): Promise<Class> => {
  const found = await prisma.class.findFirst({ where: { id: classId, schoolId } });
  if (!found) throw ApiError.notFound('Class not found');
  return found;
};

export const classesService = {
  // ---- Classes ----
  async create(schoolId: string, input: CreateClassInput): Promise<Class> {
    try {
      return await prisma.class.create({ data: { schoolId, ...input } });
    } catch (err) {
      throw onDuplicate(err, 'A class with this name already exists') ?? err;
    }
  },

  list(schoolId: string) {
    return prisma.class.findMany({
      where: { schoolId },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { sections: true, classSubjects: true } } },
    });
  },

  /** Full class detail: sections plus offered subjects. */
  async getById(schoolId: string, classId: string) {
    await assertClass(schoolId, classId);
    const detail = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        sections: { orderBy: { name: 'asc' } },
        classSubjects: { include: { subject: true }, orderBy: { subject: { name: 'asc' } } },
      },
    });
    // assertClass guarantees existence.
    return detail as NonNullable<typeof detail>;
  },

  async update(schoolId: string, classId: string, input: UpdateClassInput): Promise<Class> {
    await assertClass(schoolId, classId);
    try {
      return await prisma.class.update({ where: { id: classId }, data: input });
    } catch (err) {
      throw onDuplicate(err, 'A class with this name already exists') ?? err;
    }
  },

  async remove(schoolId: string, classId: string): Promise<void> {
    await assertClass(schoolId, classId);
    await prisma.class.delete({ where: { id: classId } });
  },

  // ---- Sections (children of a class) ----
  async createSection(
    schoolId: string,
    classId: string,
    input: CreateSectionInput,
  ): Promise<Section> {
    await assertClass(schoolId, classId);
    try {
      return await prisma.section.create({ data: { classId, ...input } });
    } catch (err) {
      throw onDuplicate(err, 'A section with this name already exists in this class') ?? err;
    }
  },

  async updateSection(
    schoolId: string,
    classId: string,
    sectionId: string,
    input: UpdateSectionInput,
  ): Promise<Section> {
    await assertClass(schoolId, classId);
    const section = await prisma.section.findFirst({ where: { id: sectionId, classId } });
    if (!section) throw ApiError.notFound('Section not found');
    try {
      return await prisma.section.update({ where: { id: sectionId }, data: input });
    } catch (err) {
      throw onDuplicate(err, 'A section with this name already exists in this class') ?? err;
    }
  },

  async removeSection(schoolId: string, classId: string, sectionId: string): Promise<void> {
    await assertClass(schoolId, classId);
    const section = await prisma.section.findFirst({ where: { id: sectionId, classId } });
    if (!section) throw ApiError.notFound('Section not found');
    await prisma.section.delete({ where: { id: sectionId } });
  },

  // ---- Offered subjects (class ↔ subject) ----
  /** Replaces the class's offered subjects with exactly `subjectIds`. */
  async setSubjects(
    schoolId: string,
    classId: string,
    input: SetClassSubjectsInput,
  ): Promise<Subject[]> {
    await assertClass(schoolId, classId);
    const subjectIds = [...new Set(input.subjectIds)];

    if (subjectIds.length > 0) {
      const owned = await prisma.subject.count({
        where: { schoolId, id: { in: subjectIds } },
      });
      if (owned !== subjectIds.length) {
        throw ApiError.badRequest('One or more subjects do not belong to this school');
      }
    }

    await prisma.$transaction([
      prisma.classSubject.deleteMany({ where: { classId } }),
      prisma.classSubject.createMany({
        data: subjectIds.map((subjectId) => ({ classId, subjectId })),
      }),
    ]);

    return prisma.subject.findMany({
      where: { classSubjects: { some: { classId } } },
      orderBy: { name: 'asc' },
    });
  },
};
