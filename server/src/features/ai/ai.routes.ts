import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { aiController } from './ai.controller';
import { generateSchema, reportCommentSchema } from './ai.validation';

const router = Router();

router.use(authenticate);

router.get('/status', aiController.status);

router.get('/insights', authorize(UserRole.SCHOOL_ADMIN), aiController.insights);

router.post(
  '/report-comment',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ body: reportCommentSchema }),
  aiController.reportComment,
);

router.post(
  '/generate',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ body: generateSchema }),
  aiController.generate,
);

export const aiRoutes = router;
