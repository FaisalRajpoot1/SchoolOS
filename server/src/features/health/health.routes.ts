import { Router } from 'express';
import { liveness, readiness } from './health.controller';

const router = Router();

router.get('/live', liveness);
router.get('/ready', readiness);

export const healthRoutes = router;
