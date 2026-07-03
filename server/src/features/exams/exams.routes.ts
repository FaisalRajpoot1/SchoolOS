import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { examsController } from './exams.controller';
import {
  bulkMarksSchema,
  createExamSchema,
  examIdParamSchema,
  examSubjectParamSchema,
  listExamsSchema,
  studentReportParamSchema,
  updateExamSchema,
  updateExamSubjectSchema,
} from './exams.validation';
import { setGradeSchemeSchema } from './grading.validation';

const router = Router();

router.use(authenticate);

const adminOnly = authorize(UserRole.SCHOOL_ADMIN);
const adminOrTeacher = authorize(UserRole.SCHOOL_ADMIN, UserRole.TEACHER);

// Grade scheme (static paths registered before the `/:id` routes).
router.get('/grade-scheme', adminOrTeacher, examsController.getGradeScheme);
router.put('/grade-scheme', adminOnly, validate({ body: setGradeSchemeSchema }), examsController.setGradeScheme);
router.delete('/grade-scheme', adminOnly, examsController.resetGradeScheme);

// Exam management (school admin).
router.post('/', adminOnly, validate({ body: createExamSchema }), examsController.create);
router.get('/', adminOrTeacher, validate({ query: listExamsSchema }), examsController.list);
router.get('/:id', adminOrTeacher, validate({ params: examIdParamSchema }), examsController.getById);
router.patch(
  '/:id',
  adminOnly,
  validate({ params: examIdParamSchema, body: updateExamSchema }),
  examsController.update,
);
router.post('/:id/publish', adminOnly, validate({ params: examIdParamSchema }), examsController.publish);
router.post('/:id/unpublish', adminOnly, validate({ params: examIdParamSchema }), examsController.unpublish);
router.delete('/:id', adminOnly, validate({ params: examIdParamSchema }), examsController.remove);

// Marking scheme.
router.patch(
  '/:id/subjects/:examSubjectId',
  adminOnly,
  validate({ params: examSubjectParamSchema, body: updateExamSubjectSchema }),
  examsController.updateExamSubject,
);

// Marks (admin or teacher).
router.get(
  '/:id/subjects/:examSubjectId/marks',
  adminOrTeacher,
  validate({ params: examSubjectParamSchema }),
  examsController.marksRoster,
);
router.post(
  '/:id/subjects/:examSubjectId/marks',
  adminOrTeacher,
  validate({ params: examSubjectParamSchema, body: bulkMarksSchema }),
  examsController.bulkMarks,
);

// Results.
router.get('/:id/results', adminOrTeacher, validate({ params: examIdParamSchema }), examsController.results);
router.get(
  '/:id/report-card/:studentId/pdf',
  adminOrTeacher,
  validate({ params: studentReportParamSchema }),
  examsController.reportCardPdf,
);

export const examRoutes = router;
