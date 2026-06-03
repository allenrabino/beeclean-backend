import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { compressController } from '../logic/compress.controller.js';

const router = Router();

router.post('/stats', authenticateToken, compressController.logStats);
router.get('/stats', authenticateToken, compressController.getStats);

export default router;
