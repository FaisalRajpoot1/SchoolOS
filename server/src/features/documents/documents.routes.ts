import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { documentsController } from './documents.controller';
import { uploadSingle } from './upload.middleware';
import {
  createDocumentSchema,
  documentIdParamSchema,
  listDocumentsSchema,
} from './documents.validation';

const router = Router();

router.use(authenticate);

// Documents are sensitive: school-admin only.
router.use(authorize(UserRole.SCHOOL_ADMIN));

// `uploadSingle` runs before `validate` so multipart text fields populate req.body.
router.post(
  '/',
  uploadSingle('file'),
  validate({ body: createDocumentSchema }),
  documentsController.create,
);
router.get('/', validate({ query: listDocumentsSchema }), documentsController.list);
router.get(
  '/:id/download',
  validate({ params: documentIdParamSchema }),
  documentsController.download,
);
router.get('/:id', validate({ params: documentIdParamSchema }), documentsController.getById);
router.delete('/:id', validate({ params: documentIdParamSchema }), documentsController.remove);

export const documentRoutes = router;
