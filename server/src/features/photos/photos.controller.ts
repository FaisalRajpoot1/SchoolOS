import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { photosService } from './photos.service';

const sendImage = (res: Response, buffer: Buffer, mimeType: string): void => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', 'inline');
  // Private: images are tenant-scoped and fetched with a bearer token.
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.status(200).send(buffer);
};

export const photosController = {
  // ---- Student photo ----
  setStudentPhoto: asyncHandler(async (req: Request, res: Response) => {
    await photosService.setStudentPhoto(requireSchoolId(req.user), req.params.id as string, req.file);
    res.status(200).json({ success: true, data: { hasPhoto: true } });
  }),

  getStudentPhoto: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, mimeType } = await photosService.getStudentPhoto(
      requireSchoolId(req.user),
      req.params.id as string,
    );
    sendImage(res, buffer, mimeType);
  }),

  deleteStudentPhoto: asyncHandler(async (req: Request, res: Response) => {
    await photosService.deleteStudentPhoto(requireSchoolId(req.user), req.params.id as string);
    res.status(204).send();
  }),

  // ---- School logo ----
  setSchoolLogo: asyncHandler(async (req: Request, res: Response) => {
    await photosService.setSchoolLogo(requireSchoolId(req.user), req.file);
    res.status(200).json({ success: true, data: { hasLogo: true } });
  }),

  getSchoolLogo: asyncHandler(async (req: Request, res: Response) => {
    const { buffer, mimeType } = await photosService.getSchoolLogo(requireSchoolId(req.user));
    sendImage(res, buffer, mimeType);
  }),

  deleteSchoolLogo: asyncHandler(async (req: Request, res: Response) => {
    await photosService.deleteSchoolLogo(requireSchoolId(req.user));
    res.status(204).send();
  }),
};
