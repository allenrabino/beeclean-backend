import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { quotaController } from '../logic/quota.controller.js';

const router = Router();

router.get('/check', authenticateToken, quotaController.checkQuota);
router.post('/consume', authenticateToken, quotaController.consumeFreeDeletes);
router.post('/grant-ad-reward', authenticateToken, quotaController.grantAdReward);

// Section-aware endpoints
router.post('/consume-section', authenticateToken, quotaController.consumeSectionQuota);
router.post('/grant-ad-reward-section', authenticateToken, quotaController.grantSectionAdReward);

export default router;
