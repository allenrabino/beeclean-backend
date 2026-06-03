import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { chatController } from '../logic/chat.controller.js';

const router = Router();

router.get('/', authenticateToken, chatController.list);
router.put('/:id', authenticateToken, chatController.upsert);
router.delete('/:id', authenticateToken, chatController.remove);

export default router;
