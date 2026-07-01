import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { assignmentsController } from './assignments.controller';
import {
  assignmentIdParamSchema,
  createAssignmentSchema,
  gradeSubmissionSchema,
  listAssignmentsSchema,
  recordSubmissionSchema,
  submissionStudentParamSchema,
  updateAssignmentSchema,
} from './assignments.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER));

router.post('/', validate({ body: createAssignmentSchema }), assignmentsController.create);
router.get('/', validate({ query: listAssignmentsSchema }), assignmentsController.list);
router.get('/:id', validate({ params: assignmentIdParamSchema }), assignmentsController.getById);
router.patch(
  '/:id',
  validate({ params: assignmentIdParamSchema, body: updateAssignmentSchema }),
  assignmentsController.update,
);
router.delete('/:id', validate({ params: assignmentIdParamSchema }), assignmentsController.remove);

router.get(
  '/:id/submissions',
  validate({ params: assignmentIdParamSchema }),
  assignmentsController.submissions,
);
router.put(
  '/:id/submissions/:studentId',
  validate({ params: submissionStudentParamSchema, body: recordSubmissionSchema }),
  assignmentsController.recordSubmission,
);
router.patch(
  '/:id/submissions/:studentId/grade',
  validate({ params: submissionStudentParamSchema, body: gradeSubmissionSchema }),
  assignmentsController.gradeSubmission,
);
router.delete(
  '/:id/submissions/:studentId',
  validate({ params: submissionStudentParamSchema }),
  assignmentsController.removeSubmission,
);

export const assignmentRoutes = router;
