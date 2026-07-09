import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { messagesController } from './messages.controller';
import {
  createThreadSchema,
  postMessageSchema,
  threadIdParamSchema,
} from './messages.validation';

const router = Router();

// Messaging is between parents and teachers.
router.use(authenticate, authorize(UserRole.PARENT, UserRole.TEACHER));

router.get('/contacts', messagesController.contacts);
router.get('/threads', messagesController.listThreads);
router.post('/threads', validate({ body: createThreadSchema }), messagesController.createThread);
router.get('/threads/:id', validate({ params: threadIdParamSchema }), messagesController.getThread);
router.post(
  '/threads/:id/messages',
  validate({ params: threadIdParamSchema, body: postMessageSchema }),
  messagesController.postMessage,
);

export const messageRoutes = router;
