import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { portalController } from './portal.controller';
import { attendanceQuerySchema, childParamSchema } from './portal.validation';

const router = Router();

// The parent portal is for PARENT accounts only.
router.use(authenticate, authorize(UserRole.PARENT));

router.get('/me', portalController.me);
router.get(
  '/children/:studentId/attendance',
  validate({ params: childParamSchema, query: attendanceQuerySchema }),
  portalController.childAttendance,
);
router.get(
  '/children/:studentId/invoices',
  validate({ params: childParamSchema }),
  portalController.childInvoices,
);
router.get(
  '/children/:studentId/homework',
  validate({ params: childParamSchema }),
  portalController.childHomework,
);
router.get(
  '/children/:studentId/assignments',
  validate({ params: childParamSchema }),
  portalController.childAssignments,
);
router.get(
  '/children/:studentId/results',
  validate({ params: childParamSchema }),
  portalController.childResults,
);

export const portalRoutes = router;
