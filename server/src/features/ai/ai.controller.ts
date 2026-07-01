import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { aiEnabled } from './aiClient';
import { aiService } from './ai.service';
import { insightsService } from './insights.service';

export const aiController = {
  status: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: { aiEnabled } });
  }),

  insights: asyncHandler(async (req: Request, res: Response) => {
    const data = await insightsService.atRisk(requireSchoolId(req.user));
    res.status(200).json({ success: true, data });
  }),

  reportComment: asyncHandler(async (req: Request, res: Response) => {
    const data = await aiService.reportComment(requireSchoolId(req.user), req.body);
    res.status(200).json({ success: true, data });
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const data = await aiService.generate(req.body);
    res.status(200).json({ success: true, data });
  }),
};
