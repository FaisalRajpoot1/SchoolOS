import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.SCHOOL_ADMIN), dashboardController.overview);
router.get('/teacher', authorize(UserRole.TEACHER), dashboardController.teacher);
router.get('/accountant', authorize(UserRole.ACCOUNTANT), dashboardController.accountant);

export const dashboardRoutes = router;
