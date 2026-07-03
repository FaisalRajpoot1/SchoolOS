import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { homeworkController } from './homework.controller';
import { homeworkService } from './homework.service';
import { makeAttachmentsController } from '@/features/attachments/attachments.controller';
import { attachmentParamSchema } from '@/features/attachments/attachments.validation';
import { uploadSingle } from '@/utils/fileUpload';
import {
  createHomeworkSchema,
  gradeSubmissionSchema,
  homeworkIdParamSchema,
  listHomeworkSchema,
  recordSubmissionSchema,
  submissionStudentParamSchema,
  updateHomeworkSchema,
} from './homework.validation';

const attachments = makeAttachmentsController(homeworkService);

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
