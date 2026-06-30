import { Router } from 'express';
import { healthRoutes } from '@/features/health/health.routes';
import { authRoutes } from '@/features/auth/auth.routes';
import { schoolRoutes } from '@/features/schools/schools.routes';
import { academicYearRoutes } from '@/features/academicYears/academicYears.routes';
import { classRoutes } from '@/features/classes/classes.routes';
import { subjectRoutes } from '@/features/subjects/subjects.routes';
import { studentRoutes } from '@/features/students/students.routes';
import { teacherRoutes } from '@/features/teachers/teachers.routes';
import { attendanceRoutes } from '@/features/attendance/attendance.routes';

/**
 * Aggregates all feature routers under the API prefix.
 * New feature modules register their router here.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/attendance', attendanceRoutes);
// ...future feature routers

export const apiRouter = router;
