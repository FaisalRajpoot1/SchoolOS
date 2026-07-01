import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { generateBody, titleForType } from './template';
import type { CreateCertificateInput, ListCertificatesQuery } from './certificates.validation';

const studentSelect = {
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
} satisfies Prisma.CertificateInclude;

const nextSerialNo = async (schoolId: string): Promise<string> => {
  const count = await prisma.certificate.count({ where: { schoolId } });
  return `CERT-${String(count + 1).padStart(5, '0')}`;
};

export const certificatesService = {
  /** Issues a certificate, auto-generating title/body from a template if omitted. */
  async issue(schoolId: string, input: CreateCertificateInput) {
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        class: { select: { name: true } },
      },
    });
    if (!student) throw ApiError.badRequest('Invalid student for this school');

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    const date = new Date().toISOString().slice(0, 10);
    const ctx = {
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      className: student.class?.name ?? null,
      schoolName: school?.name ?? 'the school',
      date,
    };

    const serialNo = await nextSerialNo(schoolId);
    const verificationCode = randomBytes(8).toString('hex');

    try {
      return await prisma.certificate.create({
        data: {
          schoolId,
          studentId: input.studentId,
          type: input.type,
          serialNo,
          verificationCode,
          title: input.title ?? titleForType(input.type),
          body: input.body ?? generateBody(input.type, ctx),
        },
        include: studentSelect,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('Certificate serial collision, please retry');
      }
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListCertificatesQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.CertificateWhereInput = {
      schoolId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { serialNo: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.certificate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: studentSelect,
      }),
      prisma.certificate.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const certificate = await prisma.certificate.findFirst({
      where: { id, schoolId },
      include: studentSelect,
    });
    if (!certificate) throw ApiError.notFound('Certificate not found');
    return certificate;
  },

  async remove(schoolId: string, id: string): Promise<void> {
    const existing = await prisma.certificate.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw ApiError.notFound('Certificate not found');
    await prisma.certificate.delete({ where: { id } });
  },

  /** Public lookup by verification code — returns minimal, non-sensitive info. */
  async verify(code: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      select: {
        serialNo: true,
        type: true,
        title: true,
        issueDate: true,
        student: { select: { firstName: true, lastName: true } },
        school: { select: { name: true } },
      },
    });
    if (!certificate) return { valid: false as const };
    return {
      valid: true as const,
      certificate: {
        serialNo: certificate.serialNo,
        type: certificate.type,
        title: certificate.title,
        issueDate: certificate.issueDate,
        studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
        schoolName: certificate.school.name,
      },
    };
  },
};
