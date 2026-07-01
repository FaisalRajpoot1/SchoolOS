import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { parentsController } from './parents.controller';
import {
  childParamSchema,
  createParentSchema,
  linkChildSchema,
  listParentsSchema,
  parentIdParamSchema,
  updateParentSchema,
} from './parents.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/', validate({ body: createParentSchema }), parentsController.create);
router.get('/', validate({ query: listParentsSchema }), parentsController.list);
router.get('/:id', validate({ params: parentIdParamSchema }), parentsController.getById);
router.patch(
  '/:id',
  validate({ params: parentIdParamSchema, body: updateParentSchema }),
  parentsController.update,
);
router.delete('/:id', validate({ params: parentIdParamSchema }), parentsController.remove);

router.post(
  '/:id/children',
  validate({ params: parentIdParamSchema, body: linkChildSchema }),
  parentsController.linkChild,
);
router.delete(
  '/:id/children/:studentId',
  validate({ params: childParamSchema }),
  parentsController.unlinkChild,
);

export const parentRoutes = router;
