import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { certificatesController } from './certificates.controller';
import {
  certificateIdParamSchema,
  createCertificateSchema,
  listCertificatesSchema,
  verifyCodeParamSchema,
} from './certificates.validation';

const router = Router();

// Public verification (no auth) — declared before the auth guard.
router.get('/verify/:code', validate({ params: verifyCodeParamSchema }), certificatesController.verify);

// Management: school admins and receptionists.
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.RECEPTIONIST));

router.post('/', validate({ body: createCertificateSchema }), certificatesController.issue);
router.get('/', validate({ query: listCertificatesSchema }), certificatesController.list);
router.get('/:id', validate({ params: certificateIdParamSchema }), certificatesController.getById);
router.get('/:id/pdf', validate({ params: certificateIdParamSchema }), certificatesController.pdf);
router.delete('/:id', validate({ params: certificateIdParamSchema }), certificatesController.remove);

export const certificateRoutes = router;
