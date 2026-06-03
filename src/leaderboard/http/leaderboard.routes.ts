import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { leaderboardController } from '../logic/leaderboard.controller.js';

const router = Router();

router.get('/', authenticateToken, leaderboardController.getLeaderboard);

export default router;
