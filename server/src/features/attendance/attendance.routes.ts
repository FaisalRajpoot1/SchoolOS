import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { attendanceController } from './attendance.controller';
import {
  bulkMarkSchema,
  rosterQuerySchema,
  studentHistoryQuerySchema,
  studentIdParamSchema,
} from './attendance.validation';

const router = Router();

// Attendance can be taken/viewed by school admins and teachers.
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER));

router.get('/', validate({ query: rosterQuerySchema }), attendanceController.roster);
router.post('/', validate({ body: bulkMarkSchema }), attendanceController.bulkMark);
router.get(
  '/students/:studentId',
  validate({ params: studentIdParamSchema, query: studentHistoryQuerySchema }),
  attendanceController.studentHistory,
);

export const attendanceRoutes = router;
