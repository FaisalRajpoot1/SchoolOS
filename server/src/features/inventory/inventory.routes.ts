import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { inventoryController } from './inventory.controller';
import {
  createItemSchema,
  createSupplierSchema,
  itemIdParamSchema,
  listItemsSchema,
  stockTxnSchema,
  supplierIdParamSchema,
  updateItemSchema,
  updateSupplierSchema,
} from './inventory.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

// Suppliers.
router.post('/suppliers', validate({ body: createSupplierSchema }), inventoryController.createSupplier);
router.get('/suppliers', inventoryController.listSuppliers);
router.patch(
  '/suppliers/:id',
  validate({ params: supplierIdParamSchema, body: updateSupplierSchema }),
  inventoryController.updateSupplier,
);
router.delete('/suppliers/:id', validate({ params: supplierIdParamSchema }), inventoryController.removeSupplier);

// Items.
router.post('/items', validate({ body: createItemSchema }), inventoryController.createItem);
router.get('/items', validate({ query: listItemsSchema }), inventoryController.listItems);
router.get('/items/:id', validate({ params: itemIdParamSchema }), inventoryController.getItem);
router.patch(
  '/items/:id',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  inventoryController.updateItem,
);
router.delete('/items/:id', validate({ params: itemIdParamSchema }), inventoryController.removeItem);

// Stock movements.
router.post(
  '/items/:id/stock',
  validate({ params: itemIdParamSchema, body: stockTxnSchema }),
  inventoryController.recordTransaction,
);

export const inventoryRoutes = router;
