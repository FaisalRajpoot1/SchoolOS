import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { schoolsController } from './schools.controller';
import {
  createSchoolSchema,
  listSchoolsSchema,
  schoolIdParamSchema,
  setSchoolStatusSchema,
  updateSchoolSchema,
} from './schools.validation';

const router = Router();

// Everything here requires authentication.
router.use(authenticate);

// ---- Tenant self-service: a school admin manages their own school. ----
router.get('/me', authorize(UserRole.SCHOOL_ADMIN), schoolsController.getMine);
router.patch(
  '/me',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ body: updateSchoolSchema }),
  schoolsController.updateMine,
);

// ---- Platform administration: SUPER_ADMIN only. ----
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validate({ body: createSchoolSchema }),
  schoolsController.create,
);
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validate({ query: listSchoolsSchema }),
  schoolsController.list,
);
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate({ params: schoolIdParamSchema }),
  schoolsController.getById,
);
router.patch(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate({ params: schoolIdParamSchema, body: updateSchoolSchema }),
  schoolsController.update,
);
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN),
  validate({ params: schoolIdParamSchema, body: setSchoolStatusSchema }),
  schoolsController.setStatus,
);

export const schoolRoutes = router;
