import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { feeCategoriesController } from './feeCategories.controller';
import {
  createFeeCategorySchema,
  feeCategoryIdParamSchema,
  updateFeeCategorySchema,
} from './feeCategories.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT));

router.post('/', validate({ body: createFeeCategorySchema }), feeCategoriesController.create);
router.get('/', feeCategoriesController.list);
router.patch(
  '/:id',
  validate({ params: feeCategoryIdParamSchema, body: updateFeeCategorySchema }),
  feeCategoriesController.update,
);
router.delete(
  '/:id',
  validate({ params: feeCategoryIdParamSchema }),
  feeCategoriesController.remove,
);

export const feeCategoryRoutes = router;
