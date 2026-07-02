import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { studentsController } from './students.controller';
import {
  bulkImportSchema,
  createStudentSchema,
  guardianIdParamSchema,
  guardianInputSchema,
  listStudentsSchema,
  portalAccessSchema,
  setStudentStatusSchema,
  studentIdParamSchema,
  updateGuardianSchema,
  updateStudentSchema,
} from './students.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

// Students.
router.post('/', validate({ body: createStudentSchema }), studentsController.create);
router.post('/bulk-import', validate({ body: bulkImportSchema }), studentsController.bulkImport);
router.get('/', validate({ query: listStudentsSchema }), studentsController.list);
router.get('/:id', validate({ params: studentIdParamSchema }), studentsController.getById);
router.patch(
  '/:id',
  validate({ params: studentIdParamSchema, body: updateStudentSchema }),
  studentsController.update,
);
router.patch(
  '/:id/status',
  validate({ params: studentIdParamSchema, body: setStudentStatusSchema }),
  studentsController.setStatus,
);
router.delete('/:id', validate({ params: studentIdParamSchema }), studentsController.remove);

// Enable/reset a student-portal login for the student.
router.post(
  '/:id/portal-access',
  validate({ params: studentIdParamSchema, body: portalAccessSchema }),
  studentsController.setPortalAccess,
);

// Guardians (nested under a student).
router.post(
  '/:id/guardians',
  validate({ params: studentIdParamSchema, body: guardianInputSchema }),
  studentsController.addGuardian,
);
router.patch(
  '/:id/guardians/:guardianId',
  validate({ params: guardianIdParamSchema, body: updateGuardianSchema }),
  studentsController.updateGuardian,
);
router.delete(
  '/:id/guardians/:guardianId',
  validate({ params: guardianIdParamSchema }),
  studentsController.removeGuardian,
);

export const studentRoutes = router;
