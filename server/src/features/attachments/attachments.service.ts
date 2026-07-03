import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { ApiError } from '@/utils/ApiError';
import { fileStorage } from '@/utils/fileStorage';
import { buildStorageKey, mimeForExtension, safeExtension } from '@/utils/fileKey';

/** Identifies the task an attachment hangs off (exactly one owner). */
export type AttachmentOwner = { homeworkId: string } | { assignmentId: string };

export interface UploadedFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

const attachmentSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AttachmentSelect;

const ownerWhere = (owner: AttachmentOwner): Prisma.AttachmentWhereInput =>
  'homeworkId' in owner ? { homeworkId: owner.homeworkId } : { assignmentId: owner.assignmentId };

/**
 * Storage + metadata for task attachments. Callers are responsible for
 * asserting the actor may manage the owning task before create/remove.
 */
export const attachmentsService = {
  async create(
    schoolId: string,
    uploadedById: string,
    owner: AttachmentOwner,
    file: UploadedFile | undefined,
  ) {
    if (!file) throw ApiError.badRequest('A file is required');
    const ext = safeExtension(file.originalname);
    if (ext === '') throw ApiError.badRequest('Unsupported file type');

    const storageKey = buildStorageKey(randomUUID(), file.originalname);
    await fileStorage.save(storageKey, file.buffer);
    try {
      return await prisma.attachment.create({
        data: {
          schoolId,
          uploadedById,
          originalName: file.originalname,
          mimeType: mimeForExtension(ext),
          sizeBytes: file.size,
          storageKey,
          ...('homeworkId' in owner
            ? { homeworkId: owner.homeworkId }
            : { assignmentId: owner.assignmentId }),
        },
        select: attachmentSelect,
      });
    } catch (err) {
      await fileStorage.remove(storageKey);
      throw err;
    }
  },

  list(schoolId: string, owner: AttachmentOwner) {
    return prisma.attachment.findMany({
      where: { schoolId, ...ownerWhere(owner) },
      orderBy: { createdAt: 'asc' },
      select: attachmentSelect,
    });
  },

  /** Loads an attachment's binary for download, scoped to its owning task. */
  async download(schoolId: string, owner: AttachmentOwner, attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, schoolId, ...ownerWhere(owner) },
      select: { storageKey: true, originalName: true, mimeType: true },
    });
    if (!attachment) throw ApiError.notFound('Attachment not found');
    const buffer = await fileStorage.read(attachment.storageKey);
    return { buffer, filename: attachment.originalName, mimeType: attachment.mimeType };
  },

  async remove(schoolId: string, owner: AttachmentOwner, attachmentId: string): Promise<void> {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, schoolId, ...ownerWhere(owner) },
      select: { id: true, storageKey: true },
    });
    if (!attachment) throw ApiError.notFound('Attachment not found');
    await prisma.attachment.delete({ where: { id: attachment.id } });
    await fileStorage.remove(attachment.storageKey);
  },
};
