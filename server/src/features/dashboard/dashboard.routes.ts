import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.get('/', dashboardController.overview);

export const dashboardRoutes = router;
