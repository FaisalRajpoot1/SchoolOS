import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { homeworkController } from './homework.controller';
import { homeworkService, homeworkSubmissionAttachmentsService } from './homework.service';
import { makeAttachmentsController } from '@/features/attachments/attachments.controller';
import { attachmentParamSchema } from '@/features/attachments/attachments.validation';
import { uploadSingle } from '@/utils/fileUpload';
import {
  createHomeworkSchema,
  gradeSubmissionSchema,
  homeworkIdParamSchema,
  listHomeworkSchema,
  recordSubmissionSchema,
  submissionIdParamSchema,
  submissionStudentParamSchema,
  updateHomeworkSchema,
} from './homework.validation';

const attachments = makeAttachmentsController(homeworkService);
const submissionAttachments = makeAttachmentsController(homeworkSubmissionAttachmentsService);

const router = Router();

// Homework is managed by school admins and teachers.
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER));

router.post('/', validate({ body: createHomeworkSchema }), homeworkController.create);
router.get('/', validate({ query: listHomeworkSchema }), homeworkController.list);
router.get('/:id', validate({ params: homeworkIdParamSchema }), homeworkController.getById);
router.patch(
  '/:id',
  validate({ params: homeworkIdParamSchema, body: updateHomeworkSchema }),
  homeworkController.update,
);
router.delete('/:id', validate({ params: homeworkIdParamSchema }), homeworkController.remove);

// Attachments (teacher brief/worksheet on the task).
router.get('/:id/attachments', validate({ params: homeworkIdParamSchema }), attachments.list);
router.post(
  '/:id/attachments',
  validate({ params: homeworkIdParamSchema }),
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
// Registered before `/:id/...` param routes — the literal `submissions` prefix
// keeps them unambiguous.
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

// Submissions (keyed by student within a homework).
router.get('/:id/submissions', validate({ params: homeworkIdParamSchema }), homeworkController.submissions);
router.put(
  '/:id/submissions/:studentId',
  validate({ params: submissionStudentParamSchema, body: recordSubmissionSchema }),
  homeworkController.recordSubmission,
);
router.patch(
  '/:id/submissions/:studentId/grade',
  validate({ params: submissionStudentParamSchema, body: gradeSubmissionSchema }),
  homeworkController.gradeSubmission,
);
router.delete(
  '/:id/submissions/:studentId',
  validate({ params: submissionStudentParamSchema }),
  homeworkController.removeSubmission,
);

export const homeworkRoutes = router;
