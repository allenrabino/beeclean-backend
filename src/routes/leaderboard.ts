import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { leaderboardController } from '../controllers/leaderboard.controller.js';

const router = Router();

router.get('/', authenticateToken, leaderboardController.getLeaderboard);

export default router;
