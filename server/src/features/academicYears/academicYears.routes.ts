import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { academicYearsController } from './academicYears.controller';
import {
  academicYearIdParamSchema,
  createAcademicYearSchema,
  updateAcademicYearSchema,
} from './academicYears.validation';

const router = Router();

// Academic years are managed by a school's admin, scoped to that school.
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/', validate({ body: createAcademicYearSchema }), academicYearsController.create);
router.get('/', academicYearsController.list);
router.get(
  '/:id',
  validate({ params: academicYearIdParamSchema }),
  academicYearsController.getById,
);
router.patch(
  '/:id',
  validate({ params: academicYearIdParamSchema, body: updateAcademicYearSchema }),
  academicYearsController.update,
);
router.patch(
  '/:id/current',
  validate({ params: academicYearIdParamSchema }),
  academicYearsController.setCurrent,
);
router.delete(
  '/:id',
  validate({ params: academicYearIdParamSchema }),
  academicYearsController.remove,
);

export const academicYearRoutes = router;
