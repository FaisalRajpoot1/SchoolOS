import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { aiController } from './ai.controller';
import { generateSchema, reportCommentSchema } from './ai.validation';

const router = Router();

// Generation endpoints can incur paid LLM calls — cap them tightly per client,
// well below the global limiter, to prevent cost abuse.
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Keyed per authenticated user (this runs after `authenticate`), so quota is
  // per-account rather than shared across a school's public IP.
  keyGenerator: (req) => req.user?.id ?? 'anonymous',
  message: { success: false, message: 'Too many AI generation requests; please try again later' },
});

router.use(authenticate);

router.get('/status', aiController.status);

router.get('/insights', authorize(UserRole.SCHOOL_ADMIN), aiController.insights);

router.post(
  '/report-comment',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  generationLimiter,
  validate({ body: reportCommentSchema }),
  aiController.reportComment,
);

router.post(
  '/generate',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  generationLimiter,
  validate({ body: generateSchema }),
  aiController.generate,
);

export const aiRoutes = router;
