import { randomUUID } from 'node:crypto';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { fileStorage } from '@/utils/fileStorage';
import { buildImageKey, imageExtension, imageMime } from './photoKey';

interface UploadedFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

interface ImageResponse {
  buffer: Buffer;
  mimeType: string;
}

/** Validates an image upload and returns its storage key + derived MIME. */
const prepareImage = async (
  file: UploadedFile | undefined,
): Promise<{ key: string; mimeType: string; buffer: Buffer }> => {
  if (!file) throw ApiError.badRequest('An image file is required');
  const ext = imageExtension(file.originalname);
  if (ext === '') throw ApiError.badRequest('Unsupported image type (use PNG, JPG, WEBP, or GIF)');
  return { key: buildImageKey(randomUUID(), ext), mimeType: imageMime(ext), buffer: file.buffer };
};

/** Serves a stored image by its key, mapping a missing blob to a 404. */
const readImage = async (key: string, ext: string): Promise<ImageResponse> => {
  const buffer = await fileStorage.read(key).catch(() => {
    throw ApiError.notFound('Image not found');
  });
  return { buffer, mimeType: imageMime(ext) };
};

const extOf = (key: string): string => key.slice(key.lastIndexOf('.'));

export const photosService = {
  // ---- Student photo ----

  async setStudentPhoto(schoolId: string, studentId: string, file: UploadedFile | undefined) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, photoKey: true },
    });
    if (!student) throw ApiError.notFound('Student not found');

    const { key, buffer } = await prepareImage(file);
    await fileStorage.save(key, buffer);
    try {
      await prisma.student.update({ where: { id: student.id }, data: { photoKey: key } });
    } catch (err) {
      await fileStorage.remove(key);
      throw err;
    }
    // Best-effort cleanup of the replaced image.
    if (student.photoKey && student.photoKey !== key) await fileStorage.remove(student.photoKey);
  },

  async getStudentPhoto(schoolId: string, studentId: string): Promise<ImageResponse> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { photoKey: true },
    });
    if (!student) throw ApiError.notFound('Student not found');
    if (!student.photoKey) throw ApiError.notFound('No photo for this student');
    return readImage(student.photoKey, extOf(student.photoKey));
  },

  async deleteStudentPhoto(schoolId: string, studentId: string): Promise<void> {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, photoKey: true },
    });
    if (!student) throw ApiError.notFound('Student not found');
    if (!student.photoKey) return;
    await prisma.student.update({ where: { id: student.id }, data: { photoKey: null } });
    await fileStorage.remove(student.photoKey);
  },

  // ---- Teacher photo ----

  async setTeacherPhoto(schoolId: string, teacherId: string, file: UploadedFile | undefined) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, photoKey: true },
    });
    if (!teacher) throw ApiError.notFound('Teacher not found');

    const { key, buffer } = await prepareImage(file);
    await fileStorage.save(key, buffer);
    try {
      await prisma.teacher.update({ where: { id: teacher.id }, data: { photoKey: key } });
    } catch (err) {
      await fileStorage.remove(key);
      throw err;
    }
    if (teacher.photoKey && teacher.photoKey !== key) await fileStorage.remove(teacher.photoKey);
  },

  async getTeacherPhoto(schoolId: string, teacherId: string): Promise<ImageResponse> {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { photoKey: true },
    });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    if (!teacher.photoKey) throw ApiError.notFound('No photo for this teacher');
    return readImage(teacher.photoKey, extOf(teacher.photoKey));
  },

  async deleteTeacherPhoto(schoolId: string, teacherId: string): Promise<void> {
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, photoKey: true },
    });
    if (!teacher) throw ApiError.notFound('Teacher not found');
    if (!teacher.photoKey) return;
    await prisma.teacher.update({ where: { id: teacher.id }, data: { photoKey: null } });
    await fileStorage.remove(teacher.photoKey);
  },

  // ---- School logo ----

  async setSchoolLogo(schoolId: string, file: UploadedFile | undefined) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, logoKey: true },
    });
    if (!school) throw ApiError.notFound('School not found');

    const { key, buffer } = await prepareImage(file);
    await fileStorage.save(key, buffer);
    try {
      await prisma.school.update({ where: { id: school.id }, data: { logoKey: key } });
    } catch (err) {
      await fileStorage.remove(key);
      throw err;
    }
    if (school.logoKey && school.logoKey !== key) await fileStorage.remove(school.logoKey);
  },

  async getSchoolLogo(schoolId: string): Promise<ImageResponse> {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { logoKey: true },
    });
    if (!school?.logoKey) throw ApiError.notFound('No logo for this school');
    return readImage(school.logoKey, extOf(school.logoKey));
  },

  async deleteSchoolLogo(schoolId: string): Promise<void> {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, logoKey: true },
    });
    if (!school?.logoKey) return;
    await prisma.school.update({ where: { id: school.id }, data: { logoKey: null } });
    await fileStorage.remove(school.logoKey);
  },
};
