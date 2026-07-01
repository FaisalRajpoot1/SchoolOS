import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { apiKeysController } from './apiKeys.controller';
import { apiKeyIdParamSchema, createApiKeySchema } from './apiKeys.validation';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/api-keys', validate({ body: createApiKeySchema }), apiKeysController.create);
router.get('/api-keys', apiKeysController.list);
router.delete('/api-keys/:id', validate({ params: apiKeyIdParamSchema }), apiKeysController.remove);

export const settingsRoutes = router;
