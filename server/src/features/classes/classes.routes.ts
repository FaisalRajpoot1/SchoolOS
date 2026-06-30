import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { classesController } from './classes.controller';
import {
  classIdParamSchema,
  createClassSchema,
  createSectionSchema,
  sectionIdParamSchema,
  setClassSubjectsSchema,
  updateClassSchema,
  updateSectionSchema,
} from './classes.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

// Classes.
router.post('/', validate({ body: createClassSchema }), classesController.create);
router.get('/', classesController.list);
router.get('/:classId', validate({ params: classIdParamSchema }), classesController.getById);
router.patch(
  '/:classId',
  validate({ params: classIdParamSchema, body: updateClassSchema }),
  classesController.update,
);
router.delete('/:classId', validate({ params: classIdParamSchema }), classesController.remove);

// Sections (nested under a class).
router.post(
  '/:classId/sections',
  validate({ params: classIdParamSchema, body: createSectionSchema }),
  classesController.createSection,
);
router.patch(
  '/:classId/sections/:sectionId',
  validate({ params: sectionIdParamSchema, body: updateSectionSchema }),
  classesController.updateSection,
);
router.delete(
  '/:classId/sections/:sectionId',
  validate({ params: sectionIdParamSchema }),
  classesController.removeSection,
);

// Offered subjects (replace the full set).
router.put(
  '/:classId/subjects',
  validate({ params: classIdParamSchema, body: setClassSubjectsSchema }),
  classesController.setSubjects,
);

export const classRoutes = router;
