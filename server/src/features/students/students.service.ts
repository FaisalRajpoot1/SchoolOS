import { type Guardian, Prisma, type Student, UserRole } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { hashPassword } from '@/utils/password';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  BulkImportInput,
  CreateStudentInput,
  GuardianInput,
  ListStudentsQuery,
  PortalAccessInput,
  UpdateStudentInput,
} from './students.validation';

interface ImportRowResult {
  index: number;
  admissionNo: string | null;
  ok: boolean;
  error: string | null;
}

/** Validates that a class/section placement is consistent and tenant-owned. */
const resolveEnrollment = async (
  schoolId: string,
  classId: string | null | undefined,
  sectionId: string | null | undefined,
): Promise<void> => {
  if (classId) {
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) throw ApiError.badRequest('Invalid class for this school');
  }
  if (sectionId) {
    if (!classId) throw ApiError.badRequest('A class is required when assigning a section');
    const section = await prisma.section.findFirst({ where: { id: sectionId, classId } });
    if (!section) throw ApiError.badRequest('Section does not belong to the selected class');
  }
};

const studentDetailInclude = {
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  guardians: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
} satisfies Prisma.StudentInclude;

/** Generates the next sequential admission number for a school. */
const nextAdmissionNo = async (schoolId: string): Promise<string> => {
  const count = await prisma.student.count({ where: { schoolId } });
  return `ADM-${String(count + 1).padStart(5, '0')}`;
};

export const studentsService = {
  async create(schoolId: string, input: CreateStudentInput): Promise<Student> {
    await resolveEnrollment(schoolId, input.classId, input.sectionId);
    const admissionNo = input.admissionNo ?? (await nextAdmissionNo(schoolId));

    try {
      return await prisma.student.create({
        data: {
          schoolId,
          admissionNo,
          firstName: input.firstName,
          lastName: input.lastName,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          phone: input.phone,
          address: input.address,
          admissionDate: input.admissionDate,
          classId: input.classId,
          sectionId: input.sectionId,
          guardians: input.guardians?.length
            ? { create: input.guardians }
            : undefined,
        },
        include: studentDetailInclude,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A student with this admission number already exists');
      }
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListStudentsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);

    const where: Prisma.StudentWhereInput = {
      schoolId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { admissionNo: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          _count: { select: { guardians: true } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const student = await prisma.student.findFirst({
      where: { id, schoolId },
      include: studentDetailInclude,
    });
    if (!student) throw ApiError.notFound('Student not found');
    return student;
  },

  async update(schoolId: string, id: string, input: UpdateStudentInput): Promise<Student> {
    const existing = await this.getById(schoolId, id);

    // Merge enrollment with existing values to validate the final placement.
    const classId = 'classId' in input ? input.classId : existing.classId;
    const sectionId = 'sectionId' in input ? input.sectionId : existing.sectionId;
    if ('classId' in input || 'sectionId' in input) {
      await resolveEnrollment(schoolId, classId, sectionId);
    }

    return prisma.student.update({
      where: { id },
      data: input,
      include: studentDetailInclude,
    });
  },

  async setStatus(schoolId: string, id: string, status: Student['status']): Promise<Student> {
    await this.getById(schoolId, id);
    return prisma.student.update({ where: { id }, data: { status } });
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await this.getById(schoolId, id);
    await prisma.student.delete({ where: { id } });
  },

  // ---- Guardians ----
  async addGuardian(schoolId: string, studentId: string, input: GuardianInput): Promise<Guardian> {
    await this.getById(schoolId, studentId);
    return prisma.guardian.create({ data: { studentId, ...input } });
  },

  async updateGuardian(
    schoolId: string,
    studentId: string,
    guardianId: string,
    input: Partial<GuardianInput>,
  ): Promise<Guardian> {
    await this.getById(schoolId, studentId);
    const guardian = await prisma.guardian.findFirst({ where: { id: guardianId, studentId } });
    if (!guardian) throw ApiError.notFound('Guardian not found');
    return prisma.guardian.update({ where: { id: guardianId }, data: input });
  },

  async removeGuardian(schoolId: string, studentId: string, guardianId: string): Promise<void> {
    await this.getById(schoolId, studentId);
    const guardian = await prisma.guardian.findFirst({ where: { id: guardianId, studentId } });
    if (!guardian) throw ApiError.notFound('Guardian not found');
    await prisma.guardian.delete({ where: { id: guardianId } });
  },

  // ---- Bulk import ----
  /**
   * Validates and (unless dryRun) creates a batch of students. Class/section
   * are matched by name within the tenant. Each row succeeds or fails
   * independently; the result reports per-row outcomes.
   */
  async bulkImport(schoolId: string, input: BulkImportInput) {
    const [classes, sections] = await Promise.all([
      prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true } }),
      prisma.section.findMany({
        where: { class: { schoolId } },
        select: { id: true, name: true, classId: true },
      }),
    ]);
    const classByName = new Map(classes.map((c) => [c.name.toLowerCase(), c]));
    const sectionsByClass = new Map<string, Map<string, { id: string }>>();
    for (const s of sections) {
      const inner = sectionsByClass.get(s.classId) ?? new Map();
      inner.set(s.name.toLowerCase(), { id: s.id });
      sectionsByClass.set(s.classId, inner);
    }

    let running = await prisma.student.count({ where: { schoolId } });
    // Explicit admission numbers in this batch are reserved so generated ones
    // don't collide with them.
    const reserved = new Set(
      input.rows.map((r) => r.admissionNo).filter((a): a is string => !!a),
    );
    const results: ImportRowResult[] = [];

    for (const [i, row] of input.rows.entries()) {
      try {
        let classId: string | undefined;
        let sectionId: string | undefined;
        if (row.className) {
          const cls = classByName.get(row.className.toLowerCase());
          if (!cls) throw new Error(`Class "${row.className}" not found`);
          classId = cls.id;
          if (row.sectionName) {
            const sec = sectionsByClass.get(cls.id)?.get(row.sectionName.toLowerCase());
            if (!sec) throw new Error(`Section "${row.sectionName}" not found in ${row.className}`);
            sectionId = sec.id;
          }
        } else if (row.sectionName) {
          throw new Error('A class is required when a section is given');
        }

        let admissionNo = row.admissionNo;
        if (!admissionNo) {
          do {
            admissionNo = `ADM-${String(++running).padStart(5, '0')}`;
          } while (reserved.has(admissionNo));
        }

        if (!input.dryRun) {
          await prisma.student.create({
            data: {
              schoolId,
              admissionNo,
              firstName: row.firstName,
              lastName: row.lastName,
              gender: row.gender,
              email: row.email,
              phone: row.phone,
              classId,
              sectionId,
            },
          });
        }
        results.push({ index: i, admissionNo, ok: true, error: null });
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Invalid row';
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          message = 'Duplicate admission number';
        }
        results.push({ index: i, admissionNo: row.admissionNo ?? null, ok: false, error: message });
      }
    }

    return {
      dryRun: input.dryRun,
      total: input.rows.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },

  // ---- Student-portal access ----
  /** Creates (or resets) a STUDENT login account linked to this student. */
  async setPortalAccess(
    schoolId: string,
    studentId: string,
    input: PortalAccessInput,
  ): Promise<{ email: string }> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, firstName: true, lastName: true, userId: true },
    });
    if (!student) throw ApiError.notFound('Student not found');

    const passwordHash = await hashPassword(input.password);
    try {
      if (student.userId) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { email: input.email, passwordHash, isActive: true },
        });
      } else {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: input.email,
              passwordHash,
              firstName: student.firstName,
              lastName: student.lastName,
              role: UserRole.STUDENT,
              schoolId,
            },
          });
          await tx.student.update({ where: { id: student.id }, data: { userId: user.id } });
        });
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A user with this email already exists');
      }
      throw err;
    }
    return { email: input.email };
  },
};
