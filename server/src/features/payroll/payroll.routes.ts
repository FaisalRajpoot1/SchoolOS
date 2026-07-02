import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { payrollController } from './payroll.controller';
import {
  createPayslipSchema,
  generatePayslipsSchema,
  listPayslipsSchema,
  payslipIdParamSchema,
  updatePayslipSchema,
} from './payroll.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.HR));

router.post('/payslips/generate', validate({ body: generatePayslipsSchema }), payrollController.generate);
router.post('/payslips', validate({ body: createPayslipSchema }), payrollController.create);
router.get('/payslips', validate({ query: listPayslipsSchema }), payrollController.list);
router.get('/payslips/:id', validate({ params: payslipIdParamSchema }), payrollController.getById);
router.get('/payslips/:id/pdf', validate({ params: payslipIdParamSchema }), payrollController.pdf);
router.patch(
  '/payslips/:id',
  validate({ params: payslipIdParamSchema, body: updatePayslipSchema }),
  payrollController.update,
);
router.post('/payslips/:id/pay', validate({ params: payslipIdParamSchema }), payrollController.pay);
router.delete('/payslips/:id', validate({ params: payslipIdParamSchema }), payrollController.remove);

export const payrollRoutes = router;
