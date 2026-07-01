import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { hrController } from './hr.controller';
import {
  applyLeaveSchema,
  createEmployeeSchema,
  employeeIdParamSchema,
  leaveIdParamSchema,
  listEmployeesSchema,
  listLeaveSchema,
  reviewLeaveSchema,
  setEmployeeStatusSchema,
  updateEmployeeSchema,
} from './hr.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.HR));

// Leave listing/review (declared before "/employees/:id" not needed; distinct prefix).
router.get('/leave', validate({ query: listLeaveSchema }), hrController.listLeave);
router.patch(
  '/leave/:leaveId/status',
  validate({ params: leaveIdParamSchema, body: reviewLeaveSchema }),
  hrController.reviewLeave,
);

// Employees.
router.post('/employees', validate({ body: createEmployeeSchema }), hrController.createEmployee);
router.get('/employees', validate({ query: listEmployeesSchema }), hrController.listEmployees);
router.get('/employees/:id', validate({ params: employeeIdParamSchema }), hrController.getEmployee);
router.patch(
  '/employees/:id',
  validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  hrController.updateEmployee,
);
router.patch(
  '/employees/:id/status',
  validate({ params: employeeIdParamSchema, body: setEmployeeStatusSchema }),
  hrController.setStatus,
);
router.delete('/employees/:id', validate({ params: employeeIdParamSchema }), hrController.removeEmployee);

// Apply leave for an employee.
router.post(
  '/employees/:id/leave',
  validate({ params: employeeIdParamSchema, body: applyLeaveSchema }),
  hrController.applyLeave,
);

export const hrRoutes = router;
