import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { transportController } from './transport.controller';
import {
  createRouteSchema,
  createStopSchema,
  createVehicleSchema,
  listAllocationsSchema,
  routeIdParamSchema,
  setAllocationSchema,
  stopParamSchema,
  studentParamSchema,
  updateRouteSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from './transport.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

// Vehicles.
router.post('/vehicles', validate({ body: createVehicleSchema }), transportController.createVehicle);
router.get('/vehicles', transportController.listVehicles);
router.patch(
  '/vehicles/:id',
  validate({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  transportController.updateVehicle,
);
router.delete('/vehicles/:id', validate({ params: vehicleIdParamSchema }), transportController.removeVehicle);

// Routes.
router.post('/routes', validate({ body: createRouteSchema }), transportController.createRoute);
router.get('/routes', transportController.listRoutes);
router.get('/routes/:id', validate({ params: routeIdParamSchema }), transportController.getRoute);
router.patch(
  '/routes/:id',
  validate({ params: routeIdParamSchema, body: updateRouteSchema }),
  transportController.updateRoute,
);
router.delete('/routes/:id', validate({ params: routeIdParamSchema }), transportController.removeRoute);

// Stops (nested under a route).
router.post(
  '/routes/:id/stops',
  validate({ params: routeIdParamSchema, body: createStopSchema }),
  transportController.addStop,
);
router.delete('/routes/:id/stops/:stopId', validate({ params: stopParamSchema }), transportController.removeStop);

// Allocations (keyed by student).
router.get('/allocations', validate({ query: listAllocationsSchema }), transportController.listAllocations);
router.put(
  '/allocations/:studentId',
  validate({ params: studentParamSchema, body: setAllocationSchema }),
  transportController.setAllocation,
);
router.delete(
  '/allocations/:studentId',
  validate({ params: studentParamSchema }),
  transportController.removeAllocation,
);

export const transportRoutes = router;
