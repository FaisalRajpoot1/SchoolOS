import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import {
  buildPaginationMeta,
  toPrismaPagination,
  type PaginationMeta,
} from '@/utils/pagination';
import { fileStorage } from '@/utils/fileStorage';
import { buildStorageKey, mimeForExtension, safeExtension } from '@/utils/fileKey';
import type { CreateDocumentInput, ListDocumentsQuery } from './documents.validation';

const documentSelect = {
  id: true,
  title: true,
  category: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
  subject: { select: { id: true, name: true, code: true } },
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DocumentSelect;

const assertStudent = async (schoolId: string, studentId: string): Promise<void> => {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) throw ApiError.notFound('Student not found');
};

const assertEmployee = async (schoolId: string, employeeId: string): Promise<void> => {
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, schoolId } });
  if (!employee) throw ApiError.notFound('Employee not found');
};

const assertTeacher = async (schoolId: string, teacherId: string): Promise<void> => {
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, schoolId } });
  if (!teacher) throw ApiError.notFound('Teacher not found');
};

const assertSubject = async (schoolId: string, subjectId: string): Promise<void> => {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
  if (!subject) throw ApiError.notFound('Subject not found');
};

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const documentsService = {
  async create(
    schoolId: string,
    uploadedById: string,
    input: CreateDocumentInput,
    file: UploadedFile | undefined,
  ) {
    if (!file) throw ApiError.badRequest('A file is required');
    const ext = safeExtension(file.originalname);
    if (ext === '') throw ApiError.badRequest('Unsupported file type');
    if (input.studentId) await assertStudent(schoolId, input.studentId);
    if (input.employeeId) await assertEmployee(schoolId, input.employeeId);
    if (input.teacherId) await assertTeacher(schoolId, input.teacherId);
    if (input.subjectId) await assertSubject(schoolId, input.subjectId);

    const storageKey = buildStorageKey(randomUUID(), file.originalname);
    await fileStorage.save(storageKey, file.buffer);

    try {
      return await prisma.document.create({
        data: {
          schoolId,
          uploadedById,
          title: input.title,
          category: input.category,
          originalName: file.originalname,
          // Trust the extension, not the client-supplied part header.
          mimeType: mimeForExtension(ext),
          sizeBytes: file.size,
          storageKey,
          studentId: input.studentId ?? null,
          employeeId: input.employeeId ?? null,
          teacherId: input.teacherId ?? null,
          subjectId: input.subjectId ?? null,
        },
        select: documentSelect,
      });
    } catch (err) {
      // Don't leave an orphaned blob if the metadata insert fails.
      await fileStorage.remove(storageKey);
      throw err;
    }
  },

  async list(
    schoolId: string,
    query: ListDocumentsQuery,
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    if (query.studentId) await assertStudent(schoolId, query.studentId);
    if (query.employeeId) await assertEmployee(schoolId, query.employeeId);
    if (query.teacherId) await assertTeacher(schoolId, query.teacherId);
    if (query.subjectId) await assertSubject(schoolId, query.subjectId);
    const { skip, take } = toPrismaPagination(query);
    const where: Prisma.DocumentWhereInput = {
      schoolId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.teacherId ? { teacherId: query.teacherId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: documentSelect,
      }),
      prisma.document.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(query, total) };
  },

  async getById(schoolId: string, id: string) {
    const document = await prisma.document.findFirst({
      where: { id, schoolId },
      select: documentSelect,
    });
    if (!document) throw ApiError.notFound('Document not found');
    return document;
  },

  /** Loads a document's binary for download (tenant-scoped). */
  async download(
    schoolId: string,
    id: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const document = await prisma.document.findFirst({
      where: { id, schoolId },
      select: { storageKey: true, originalName: true, mimeType: true },
    });
    if (!document) throw ApiError.notFound('Document not found');
    const buffer = await fileStorage.read(document.storageKey);
    return { buffer, filename: document.originalName, mimeType: document.mimeType };
  },

  async remove(schoolId: string, id: string): Promise<void> {
    const document = await prisma.document.findFirst({
      where: { id, schoolId },
      select: { id: true, storageKey: true },
    });
    if (!document) throw ApiError.notFound('Document not found');
    await prisma.document.delete({ where: { id: document.id } });
    await fileStorage.remove(document.storageKey);
  },
};
