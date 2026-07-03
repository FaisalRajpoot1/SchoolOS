import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { behaviorController } from './behavior.controller';
import {
  behaviorIdParamSchema,
  createBehaviorSchema,
  listBehaviorSchema,
  studentIdParamSchema,
  updateBehaviorSchema,
} from './behavior.validation';

const router = Router();

router.use(authenticate);

// Admins and teachers record and review behaviour; deletion is admin-only.
router.post(
  '/',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ body: createBehaviorSchema }),
  behaviorController.create,
);
router.get(
  '/',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ query: listBehaviorSchema }),
  behaviorController.list,
);
// Static path before the `/:id` param route so it isn't captured as an id.
router.get(
  '/students/:studentId/summary',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ params: studentIdParamSchema }),
  behaviorController.studentSummary,
);
router.get(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ params: behaviorIdParamSchema }),
  behaviorController.getById,
);
router.patch(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ params: behaviorIdParamSchema, body: updateBehaviorSchema }),
  behaviorController.update,
);
router.delete(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ params: behaviorIdParamSchema }),
  behaviorController.remove,
);

export const behaviorRoutes = router;
