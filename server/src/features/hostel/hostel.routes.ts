import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { hostelController } from './hostel.controller';
import {
  createHostelSchema,
  createRoomSchema,
  hostelIdParamSchema,
  listAllocationsSchema,
  roomParamSchema,
  setAllocationSchema,
  studentParamSchema,
  updateHostelSchema,
  updateRoomSchema,
} from './hostel.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

// Allocations (declared before "/:id" so the static paths take precedence).
router.get('/allocations', validate({ query: listAllocationsSchema }), hostelController.listAllocations);
router.put(
  '/allocations/:studentId',
  validate({ params: studentParamSchema, body: setAllocationSchema }),
  hostelController.setAllocation,
);
router.delete(
  '/allocations/:studentId',
  validate({ params: studentParamSchema }),
  hostelController.removeAllocation,
);

// Hostels.
router.post('/', validate({ body: createHostelSchema }), hostelController.createHostel);
router.get('/', hostelController.listHostels);
router.get('/:id', validate({ params: hostelIdParamSchema }), hostelController.getHostel);
router.patch(
  '/:id',
  validate({ params: hostelIdParamSchema, body: updateHostelSchema }),
  hostelController.updateHostel,
);
router.delete('/:id', validate({ params: hostelIdParamSchema }), hostelController.removeHostel);

// Rooms (nested under a hostel).
router.post(
  '/:id/rooms',
  validate({ params: hostelIdParamSchema, body: createRoomSchema }),
  hostelController.addRoom,
);
router.patch(
  '/:id/rooms/:roomId',
  validate({ params: roomParamSchema, body: updateRoomSchema }),
  hostelController.updateRoom,
);
router.delete('/:id/rooms/:roomId', validate({ params: roomParamSchema }), hostelController.removeRoom);

export const hostelRoutes = router;
