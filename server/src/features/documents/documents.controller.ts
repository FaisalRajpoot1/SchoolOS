import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { documentsService } from './documents.service';
import { safeDownloadName } from '@/utils/fileKey';

export const documentsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const document = await documentsService.create(
      requireSchoolId(req.user),
      req.user.id,
      req.body,
      req.file,
    );
    res.status(201).json({ success: true, data: { document } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await documentsService.list(requireSchoolId(req.user), req.query as never);
    res.status(200).json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const document = await documentsService.getById(requireSchoolId(req.user), req.params.id as string);
    res.status(200).json({ success: true, data: { document } });
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, filename, mimeType } = await documentsService.download(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName(filename)}"`);
    res.status(200).send(buffer);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await documentsService.remove(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),
};
