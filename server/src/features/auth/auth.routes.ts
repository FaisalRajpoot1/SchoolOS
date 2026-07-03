import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  sessionIdParamSchema,
  twoFactorCodeSchema,
  twoFactorDisableSchema,
} from './auth.validation';

/** Tighter rate limit on credential endpoints to slow brute-force attempts. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

const router = Router();

// Public credential endpoints. Account provisioning is admin-driven (see the
// students/teachers/parents modules), so there is no public self-registration.
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

// Authenticated account + session management.
router.get('/me', authenticate, authController.me);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);
router.get('/sessions', authenticate, authController.listSessions);
router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate({ params: sessionIdParamSchema }),
  authController.revokeSession,
);
router.post('/sessions/revoke-others', authenticate, authController.revokeOtherSessions);

// Two-factor auth (TOTP). Setup/enable/regenerate are rate-limited like other
// credential operations.
router.get('/2fa', authenticate, authController.twoFactorStatus);
router.post('/2fa/setup', authenticate, authLimiter, authController.twoFactorSetup);
router.post(
  '/2fa/enable',
  authenticate,
  authLimiter,
  validate({ body: twoFactorCodeSchema }),
  authController.twoFactorEnable,
);
router.post(
  '/2fa/disable',
  authenticate,
  authLimiter,
  validate({ body: twoFactorDisableSchema }),
  authController.twoFactorDisable,
);
router.post(
  '/2fa/backup-codes',
  authenticate,
  authLimiter,
  validate({ body: twoFactorCodeSchema }),
  authController.twoFactorRegenerate,
);

export const authRoutes = router;
