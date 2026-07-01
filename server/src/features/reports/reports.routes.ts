import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { reportsController } from './reports.controller';
import { attendanceRangeSchema } from './reports.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.get('/students', reportsController.students);
router.get('/attendance', validate({ query: attendanceRangeSchema }), reportsController.attendance);
router.get('/finance', reportsController.finance);

export const reportRoutes = router;
