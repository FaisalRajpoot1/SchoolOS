import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { announcementsController } from './announcements.controller';
import {
  announcementIdParamSchema,
  createAnnouncementSchema,
  listAnnouncementsSchema,
  updateAnnouncementSchema,
} from './announcements.validation';

const router = Router();

router.use(authenticate);

// The notice board is readable by any authenticated user.
router.get('/feed', announcementsController.feed);

// Management is school-admin only.
router.post('/', authorize(UserRole.SCHOOL_ADMIN), validate({ body: createAnnouncementSchema }), announcementsController.create);
router.get('/', authorize(UserRole.SCHOOL_ADMIN), validate({ query: listAnnouncementsSchema }), announcementsController.list);
router.get('/:id', authorize(UserRole.SCHOOL_ADMIN), validate({ params: announcementIdParamSchema }), announcementsController.getById);
router.patch(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ params: announcementIdParamSchema, body: updateAnnouncementSchema }),
  announcementsController.update,
);
router.delete('/:id', authorize(UserRole.SCHOOL_ADMIN), validate({ params: announcementIdParamSchema }), announcementsController.remove);

export const announcementRoutes = router;
