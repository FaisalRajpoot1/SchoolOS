import type { Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { safeDownloadName } from '@/utils/fileKey';

type Actor = { id: string; role: UserRole };

/** The attachment surface a task service (homework/assignment) must expose. */
export interface AttachmentsCapable {
  listAttachments(schoolId: string, ownerId: string): Promise<unknown>;
  addAttachment(
    schoolId: string,
    actor: Actor,
    ownerId: string,
    file: Express.Multer.File,
  ): Promise<unknown>;
  downloadAttachment(
    schoolId: string,
    ownerId: string,
    attachmentId: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }>;
  removeAttachment(
    schoolId: string,
    actor: Actor,
    ownerId: string,
    attachmentId: string,
  ): Promise<void>;
}

/** Builds attachment route handlers bound to a task service. `ownerId` = :id. */
export const makeAttachmentsController = (service: AttachmentsCapable) => ({
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await service.listAttachments(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: items });
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest('A file is required');
    const attachment = await service.addAttachment(
      requireSchoolId(req.user),
      { id: req.user.id, role: req.user.role },
      req.params.id as string,
      req.file,
    );
    res.status(201).json({ success: true, data: { attachment } });
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename, mimeType } = await service.downloadAttachment(
      requireSchoolId(req.user),
      req.params.id as string,
      req.params.attachmentId as string,
    );
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName(filename)}"`);
    res.status(200).send(buffer);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await service.removeAttachment(
      requireSchoolId(req.user),
      { id: req.user.id, role: req.user.role },
      req.params.id as string,
      req.params.attachmentId as string,
    );
    res.status(204).send();
  }),
});
