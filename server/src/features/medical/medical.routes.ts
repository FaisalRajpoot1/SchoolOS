import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { medicalController } from './medical.controller';
import {
  createVisitSchema,
  listVisitsSchema,
  studentIdParamSchema,
  upsertProfileSchema,
  visitIdParamSchema,
} from './medical.validation';

const router = Router();

router.use(authenticate);

// Medical data is sensitive: school-admin only.
router.use(authorize(UserRole.SCHOOL_ADMIN));

router.get(
  '/students/:studentId/profile',
  validate({ params: studentIdParamSchema }),
  medicalController.getProfile,
);
router.put(
  '/students/:studentId/profile',
  validate({ params: studentIdParamSchema, body: upsertProfileSchema }),
  medicalController.upsertProfile,
);

router.get('/visits', validate({ query: listVisitsSchema }), medicalController.listVisits);
router.post('/visits', validate({ body: createVisitSchema }), medicalController.createVisit);
router.get('/visits/:id', validate({ params: visitIdParamSchema }), medicalController.getVisit);
router.delete('/visits/:id', validate({ params: visitIdParamSchema }), medicalController.removeVisit);

export const medicalRoutes = router;
