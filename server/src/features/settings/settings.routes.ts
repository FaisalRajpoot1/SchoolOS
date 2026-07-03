import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { apiKeysController } from './apiKeys.controller';
import { apiKeyIdParamSchema, createApiKeySchema } from './apiKeys.validation';
import { photosController } from '@/features/photos/photos.controller';
import { uploadSingle } from '@/utils/fileUpload';

const router = Router();

router.use(authenticate, authorize(UserRole.SCHOOL_ADMIN));

router.post('/api-keys', validate({ body: createApiKeySchema }), apiKeysController.create);
router.get('/api-keys', apiKeysController.list);
router.delete('/api-keys/:id', validate({ params: apiKeyIdParamSchema }), apiKeysController.remove);

// School logo/branding (served inline to the admin's own school).
router.post('/logo', uploadSingle('file'), photosController.setSchoolLogo);
router.get('/logo', photosController.getSchoolLogo);
router.delete('/logo', photosController.deleteSchoolLogo);

export const settingsRoutes = router;
