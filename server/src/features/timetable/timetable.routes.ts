import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { timetableController } from './timetable.controller';
import {
  createSlotSchema,
  listSlotsSchema,
  slotIdParamSchema,
  updateSlotSchema,
} from './timetable.validation';

const router = Router();

router.use(authenticate);

// Viewing is open to admins and teachers; editing is admin-only.
router.get(
  '/slots',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ query: listSlotsSchema }),
  timetableController.list,
);
router.get(
  '/slots/export',
  authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER),
  validate({ query: listSlotsSchema }),
  timetableController.exportPdf,
);
router.post(
  '/slots',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ body: createSlotSchema }),
  timetableController.create,
);
router.patch(
  '/slots/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ params: slotIdParamSchema, body: updateSlotSchema }),
  timetableController.update,
);
router.delete(
  '/slots/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ params: slotIdParamSchema }),
  timetableController.remove,
);

export const timetableRoutes = router;
