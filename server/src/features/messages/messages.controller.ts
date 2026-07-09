import type { Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireSchoolId } from '@/utils/tenant';
import { ApiError } from '@/utils/ApiError';
import { messagesService } from './messages.service';

const actor = (req: Request): { id: string; role: UserRole } => {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
};

export const messagesController = {
  contacts: asyncHandler(async (req: Request, res: Response) => {
    const data = await messagesService.contacts(requireSchoolId(req.user), actor(req));
    res.status(200).json({ success: true, data });
  }),

  listThreads: asyncHandler(async (req: Request, res: Response) => {
    const data = await messagesService.listThreads(requireSchoolId(req.user), actor(req));
    res.status(200).json({ success: true, data });
  }),

  getThread: asyncHandler(async (req: Request, res: Response) => {
    const data = await messagesService.getThread(
      requireSchoolId(req.user),
      actor(req),
      req.params.id as string,
    );
    res.status(200).json({ success: true, data });
  }),

  createThread: asyncHandler(async (req: Request, res: Response) => {
    const thread = await messagesService.createThread(requireSchoolId(req.user), actor(req), req.body);
    res.status(201).json({ success: true, data: { thread } });
  }),

  postMessage: asyncHandler(async (req: Request, res: Response) => {
    const message = await messagesService.postMessage(
      requireSchoolId(req.user),
      actor(req),
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ success: true, data: { message } });
  }),
};
