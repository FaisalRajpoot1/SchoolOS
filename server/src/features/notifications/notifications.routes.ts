import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { notificationsController } from './notifications.controller';
import { listNotificationsSchema, notificationIdParamSchema } from './notifications.validation';

const router = Router();

router.use(authenticate);

// Every authenticated user manages their own inbox.
router.get('/', validate({ query: listNotificationsSchema }), notificationsController.list);
router.get('/unread-count', notificationsController.unreadCount);
router.post('/read-all', notificationsController.markAllRead);
router.post(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  notificationsController.markRead,
);
router.delete('/:id', validate({ params: notificationIdParamSchema }), notificationsController.remove);

export const notificationRoutes = router;
