import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { invoicesController } from './invoices.controller';
import {
  addPaymentSchema,
  createInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesSchema,
  paymentIdParamSchema,
  updateInvoiceSchema,
} from './invoices.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT));

router.post('/', validate({ body: createInvoiceSchema }), invoicesController.create);
router.get('/', validate({ query: listInvoicesSchema }), invoicesController.list);
router.get('/:id', validate({ params: invoiceIdParamSchema }), invoicesController.getById);
router.get('/:id/pdf', validate({ params: invoiceIdParamSchema }), invoicesController.pdf);
router.patch(
  '/:id',
  validate({ params: invoiceIdParamSchema, body: updateInvoiceSchema }),
  invoicesController.update,
);
router.post('/:id/cancel', validate({ params: invoiceIdParamSchema }), invoicesController.cancel);
router.delete('/:id', validate({ params: invoiceIdParamSchema }), invoicesController.remove);

// Payments (nested under an invoice).
router.post(
  '/:id/payments',
  validate({ params: invoiceIdParamSchema, body: addPaymentSchema }),
  invoicesController.addPayment,
);
router.delete(
  '/:id/payments/:paymentId',
  validate({ params: paymentIdParamSchema }),
  invoicesController.removePayment,
);

export const invoiceRoutes = router;
