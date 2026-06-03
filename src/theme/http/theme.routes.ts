import { Router } from 'express';
import { themeController } from '../logic/theme.controller.js';

const router = Router();

// Public — no auth middleware. Theme rotation is global, not per-user.
router.get('/current', themeController.getCurrent);

export default router;
