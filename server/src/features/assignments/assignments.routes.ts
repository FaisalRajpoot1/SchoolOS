import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { assignmentsController } from './assignments.controller';
import {
  assignmentsService,
  assignmentSubmissionAttachmentsService,
} from './assignments.service';
import { makeAttachmentsController } from '@/features/attachments/attachments.controller';
import { attachmentParamSchema } from '@/features/attachments/attachments.validation';
import { uploadSingle } from '@/utils/fileUpload';
import {
  assignmentIdParamSchema,
  createAssignmentSchema,
  gradeSubmissionSchema,
  listAssignmentsSchema,
  recordSubmissionSchema,
  submissionIdParamSchema,
  submissionStudentParamSchema,
  updateAssignmentSchema,
} from './assignments.validation';

const router = Router();
const attachments = makeAttachmentsController(assignmentsService);
const submissionAttachments = makeAttachmentsController(assignmentSubmissionAttachmentsService);

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

// Attachments (teacher brief/worksheet on the task).
router.get('/:id/attachments', validate({ params: assignmentIdParamSchema }), attachments.list);
router.post(
  '/:id/attachments',
  validate({ params: assignmentIdParamSchema }),
  uploadSingle('file'),
  attachments.upload,
);
router.get(
  '/:id/attachments/:attachmentId',
  validate({ params: attachmentParamSchema }),
  attachments.download,
);
router.delete(
  '/:id/attachments/:attachmentId',
  validate({ params: attachmentParamSchema }),
  attachments.remove,
);

// Submission attachments (files turned in for a submission; `:id` = submission id).
router.get(
  '/submissions/:id/attachments',
  validate({ params: submissionIdParamSchema }),
  submissionAttachments.list,
);
router.post(
  '/submissions/:id/attachments',
  validate({ params: submissionIdParamSchema }),
  uploadSingle('file'),
  submissionAttachments.upload,
);
router.get(
  '/submissions/:id/attachments/:attachmentId',
  validate({ params: attachmentParamSchema }),
  submissionAttachments.download,
);
router.delete(
  '/submissions/:id/attachments/:attachmentId',
  validate({ params: attachmentParamSchema }),
  submissionAttachments.remove,
);

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
