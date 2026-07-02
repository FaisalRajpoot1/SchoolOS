import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import type {
  ApplyInput,
  ConvertInput,
  ListAdmissionsQuery,
  UpdateStatusInput,
} from './admissions.validation';

const studentRef = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
} satisfies Prisma.AdmissionApplicationInclude;

const assertApplication = async (schoolId: string, id: string) => {
  const application = await prisma.admissionApplication.findFirst({ where: { id, schoolId } });
  if (!application) throw ApiError.notFound('Application not found');
  return application;
};

export const admissionsService = {
  /** Public: minimal school info so the apply form can show/verify the school. */
  async publicSchool(schoolId: string) {
    const school = await prisma.school.findFirst({
      where: { id: schoolId, isActive: true },
      select: { id: true, name: true },
    });
    if (!school) throw ApiError.notFound('School not found');
    return school;
  },

  /** Public: submit an admission application. */
  async apply(input: ApplyInput): Promise<{ id: string }> {
    const school = await prisma.school.findFirst({
      where: { id: input.schoolId, isActive: true },
      select: { id: true },
    });
    if (!school) throw ApiError.badRequest('Invalid school');

    const application = await prisma.admissionApplication.create({
      data: {
        schoolId: input.schoolId,
        applicantFirstName: input.applicantFirstName,
        applicantLastName: input.applicantLastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
        guardianEmail: input.guardianEmail,
        desiredClass: input.desiredClass,
        message: input.message,
      },
      select: { id: true },
    });
    return application;
  },

  async list(
    schoolId: string,
    query: ListAdmissionsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.AdmissionApplicationWhereInput = {
      schoolId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.admissionApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: studentRef,
      }),
      prisma.admissionApplication.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const application = await prisma.admissionApplication.findFirst({
      where: { id, schoolId },
      include: studentRef,
    });
    if (!application) throw ApiError.notFound('Application not found');
    return application;
  },

  async setStatus(schoolId: string, id: string, input: UpdateStatusInput) {
    const application = await assertApplication(schoolId, id);
    if (application.status === 'CONVERTED') {
      throw ApiError.badRequest('A converted application can no longer change status');
    }
    await prisma.admissionApplication.update({ where: { id }, data: { status: input.status } });
    return this.getById(schoolId, id);
  },

  async remove(schoolId: string, id: string): Promise<void> {
    await assertApplication(schoolId, id);
    await prisma.admissionApplication.delete({ where: { id } });
  },

  /** Converts an application into an enrolled Student and marks it CONVERTED. */
  async convert(schoolId: string, id: string, input: ConvertInput) {
    const application = await assertApplication(schoolId, id);
    if (application.status === 'CONVERTED') {
      throw ApiError.badRequest('Application already converted');
    }

    if (input.classId) {
      const cls = await prisma.class.findFirst({ where: { id: input.classId, schoolId } });
      if (!cls) throw ApiError.badRequest('Invalid class for this school');
      if (input.sectionId) {
        const section = await prisma.section.findFirst({
          where: { id: input.sectionId, classId: input.classId },
        });
        if (!section) throw ApiError.badRequest('Section does not belong to the selected class');
      }
    } else if (input.sectionId) {
      throw ApiError.badRequest('A class is required when assigning a section');
    }

    // Derive the next number from the current max (delete-safe, unlike count+1).
    const last = await prisma.student.findFirst({
      where: { schoolId, admissionNo: { startsWith: 'ADM-' } },
      orderBy: { admissionNo: 'desc' },
      select: { admissionNo: true },
    });
    const nextNum = last ? (Number.parseInt(last.admissionNo.slice(4), 10) || 0) + 1 : 1;
    const admissionNo = `ADM-${String(nextNum).padStart(5, '0')}`;

    try {
      const student = await prisma.$transaction(async (tx) => {
        // Atomically claim the application; a concurrent convert that already
        // flipped it to CONVERTED yields count 0 and aborts (rolls back).
        const claim = await tx.admissionApplication.updateMany({
          where: { id, schoolId, status: { not: 'CONVERTED' } },
          data: { status: 'CONVERTED' },
        });
        if (claim.count === 0) throw ApiError.badRequest('Application already converted');

        const created = await tx.student.create({
          data: {
            schoolId,
            admissionNo,
            firstName: application.applicantFirstName,
            lastName: application.applicantLastName,
            gender: application.gender,
            dateOfBirth: application.dateOfBirth,
            classId: input.classId,
            sectionId: input.sectionId,
          },
          select: { id: true, firstName: true, lastName: true, admissionNo: true },
        });
        await tx.admissionApplication.update({
          where: { id },
          data: { studentId: created.id },
        });
        return created;
      });
      return student;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('Could not assign a unique admission number; please retry');
      }
      throw err;
    }
  },
};
