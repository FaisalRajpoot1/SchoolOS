import { Router } from 'express';
import { healthRoutes } from '@/features/health/health.routes';
import { authRoutes } from '@/features/auth/auth.routes';

/**
 * Aggregates all feature routers under the API prefix.
 * New feature modules register their router here.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
// router.use('/schools', schoolRoutes);
// ...future feature routers

export const apiRouter = router;
