import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError } from '@/utils/ApiError';
import { auditService } from './audit.service';

export const auditController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const platformWide = req.user.role === 'SUPER_ADMIN';
    const { items, meta } = await auditService.list(
      { schoolId: req.user.schoolId, platformWide },
      req.query as never,
    );
    res.status(200).json({ success: true, data: items, meta });
  }),
};
