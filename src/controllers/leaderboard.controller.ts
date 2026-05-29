import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { leaderboardService } from '../services/leaderboard.service.js';

export const leaderboardController = {
  async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await leaderboardService.getLeaderboard(req.user?.id);
      res.json(result);
    } catch (error) {
      console.error('[leaderboard] get error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  },
};
