import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { teachersController } from './teachers.controller';
import {
  createTeacherSchema,
  listTeachersSchema,
  setTeacherStatusSchema,
  teacherIdParamSchema,
  updateTeacherSchema,
} from './teachers.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/', validate({ body: createTeacherSchema }), teachersController.create);
router.get('/', validate({ query: listTeachersSchema }), teachersController.list);
router.get('/:id', validate({ params: teacherIdParamSchema }), teachersController.getById);
router.patch(
  '/:id',
  validate({ params: teacherIdParamSchema, body: updateTeacherSchema }),
  teachersController.update,
);
router.patch(
  '/:id/status',
  validate({ params: teacherIdParamSchema, body: setTeacherStatusSchema }),
  teachersController.setStatus,
);
router.delete('/:id', validate({ params: teacherIdParamSchema }), teachersController.remove);

export const teacherRoutes = router;
