import { Router } from 'express';
import { healthRoutes } from '@/features/health/health.routes';
import { authRoutes } from '@/features/auth/auth.routes';
import { schoolRoutes } from '@/features/schools/schools.routes';
import { academicYearRoutes } from '@/features/academicYears/academicYears.routes';

/**
 * Aggregates all feature routers under the API prefix.
 * New feature modules register their router here.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/academic-years', academicYearRoutes);
// ...future feature routers

export const apiRouter = router;
