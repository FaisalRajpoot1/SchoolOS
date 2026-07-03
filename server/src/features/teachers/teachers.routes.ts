import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { teachersController } from './teachers.controller';
import { photosController } from '@/features/photos/photos.controller';
import { uploadSingle } from '@/utils/fileUpload';
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

// Profile photo (served inline; fetched with a bearer token).
router.post(
  '/:id/photo',
  validate({ params: teacherIdParamSchema }),
  uploadSingle('file'),
  photosController.setTeacherPhoto,
);
router.get('/:id/photo', validate({ params: teacherIdParamSchema }), photosController.getTeacherPhoto);
router.delete(
  '/:id/photo',
  validate({ params: teacherIdParamSchema }),
  photosController.deleteTeacherPhoto,
);

export const teacherRoutes = router;
