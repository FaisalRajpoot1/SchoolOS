import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { eventsController } from './events.controller';
import {
  calendarQuerySchema,
  createEventSchema,
  eventIdParamSchema,
  listEventsSchema,
  updateEventSchema,
} from './events.validation';

const router = Router();

router.use(authenticate);

// Calendar feed + per-event .ics are readable by any authenticated user.
router.get('/calendar', validate({ query: calendarQuerySchema }), eventsController.calendar);
router.get('/:id/ics', validate({ params: eventIdParamSchema }), eventsController.ics);

// Management is school-admin only.
router.post('/', authorize(UserRole.SCHOOL_ADMIN), validate({ body: createEventSchema }), eventsController.create);
router.get('/', authorize(UserRole.SCHOOL_ADMIN), validate({ query: listEventsSchema }), eventsController.list);
router.get('/:id', authorize(UserRole.SCHOOL_ADMIN), validate({ params: eventIdParamSchema }), eventsController.getById);
router.patch(
  '/:id',
  authorize(UserRole.SCHOOL_ADMIN),
  validate({ params: eventIdParamSchema, body: updateEventSchema }),
  eventsController.update,
);
router.delete('/:id', authorize(UserRole.SCHOOL_ADMIN), validate({ params: eventIdParamSchema }), eventsController.remove);

export const eventRoutes = router;
