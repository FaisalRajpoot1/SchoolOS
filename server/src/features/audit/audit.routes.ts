import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { auditController } from './audit.controller';
import { listAuditLogsSchema } from './audit.validation';

const router = Router();

// Audit logs are visible to school admins (their school) and super admins (all).
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN));

router.get('/', validate({ query: listAuditLogsSchema }), auditController.list);

export const auditRoutes = router;
