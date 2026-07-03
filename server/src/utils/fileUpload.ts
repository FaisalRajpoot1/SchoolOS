import type { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

// Files are buffered in memory then handed to the storage backend; the size
// limit keeps that bounded. One file per request.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

/** Parses a single multipart file field, mapping multer errors to 400s. */
export const uploadSingle =
  (field: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single(field)(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest(`File exceeds the ${env.MAX_UPLOAD_MB}MB limit`));
        }
        return next(ApiError.badRequest(err.message));
      }
      if (err) return next(err instanceof Error ? err : new Error(String(err)));
      next();
    });
  };
