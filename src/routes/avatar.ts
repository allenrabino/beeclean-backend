import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { avatarController } from '../controllers/avatar.controller.js';

const router = Router();

router.get('/', authenticateToken, avatarController.getState);
router.put('/', authenticateToken, avatarController.syncState);

export default router;
