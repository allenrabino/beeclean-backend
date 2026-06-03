import { Router } from 'express';
import { contactsController } from '../logic/contacts.controller.js';
import { authenticateToken } from '../../shared/middleware/auth.js';

const router = Router();

// Contact-cleanup telemetry — the only contacts endpoints the iOS app
// actually calls (fire-and-forget from StatsService). All real contacts
// work (merge/delete/export/backup) happens on-device via CNContactStore.
router.post('/stats', authenticateToken, contactsController.logStats);
router.get('/stats', authenticateToken, contactsController.getStats);

export default router;
