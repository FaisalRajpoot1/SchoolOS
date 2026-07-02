import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { admissionsController } from './admissions.controller';
import {
  admissionIdParamSchema,
  applySchema,
  convertSchema,
  listAdmissionsSchema,
  schoolParamSchema,
  updateStatusSchema,
} from './admissions.validation';

const router = Router();

// Public endpoints — declared before the auth guard. The apply form is
// unauthenticated, so it is rate-limited to slow spam.
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many applications; please try again later' },
});

router.get('/schools/:schoolId', validate({ params: schoolParamSchema }), admissionsController.publicSchool);
router.post('/apply', applyLimiter, validate({ body: applySchema }), admissionsController.apply);

// Admin (school admins only).
router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.get('/', validate({ query: listAdmissionsSchema }), admissionsController.list);
router.get('/:id', validate({ params: admissionIdParamSchema }), admissionsController.getById);
router.patch(
  '/:id/status',
  validate({ params: admissionIdParamSchema, body: updateStatusSchema }),
  admissionsController.setStatus,
);
router.post(
  '/:id/convert',
  validate({ params: admissionIdParamSchema, body: convertSchema }),
  admissionsController.convert,
);
router.delete('/:id', validate({ params: admissionIdParamSchema }), admissionsController.remove);

export const admissionRoutes = router;
