import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { subjectsController } from './subjects.controller';
import {
  createSubjectSchema,
  subjectIdParamSchema,
  updateSubjectSchema,
} from './subjects.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/', validate({ body: createSubjectSchema }), subjectsController.create);
router.get('/', subjectsController.list);
router.patch(
  '/:id',
  validate({ params: subjectIdParamSchema, body: updateSubjectSchema }),
  subjectsController.update,
);
router.delete('/:id', validate({ params: subjectIdParamSchema }), subjectsController.remove);

export const subjectRoutes = router;
