import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { studentPortalController } from './studentPortal.controller';
import { attendanceQuerySchema } from './studentPortal.validation';

const router = Router();

// The student portal is for STUDENT accounts only.
router.use(authenticate, authorize(UserRole.STUDENT));

router.get('/me', studentPortalController.me);
router.get(
  '/attendance',
  validate({ query: attendanceQuerySchema }),
  studentPortalController.attendance,
);
router.get('/invoices', studentPortalController.invoices);
router.get('/homework', studentPortalController.homework);
router.get('/assignments', studentPortalController.assignments);
router.get('/results', studentPortalController.results);

export const studentPortalRoutes = router;
