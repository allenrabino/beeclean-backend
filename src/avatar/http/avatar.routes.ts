import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { avatarController } from '../logic/avatar.controller.js';

const router = Router();

router.get('/', authenticateToken, avatarController.getState);
router.put('/', authenticateToken, avatarController.syncState);

export default router;
