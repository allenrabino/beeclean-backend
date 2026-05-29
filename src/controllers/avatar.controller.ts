import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { avatarService } from '../services/avatar.service.js';

export const avatarController = {
  async getState(req: AuthenticatedRequest, res: Response) {
    try {
      const state = await avatarService.getState(req.user!.id);
      res.json(state);
    } catch (error) {
      console.error('[avatar] get error:', error);
      res.status(500).json({ error: 'Failed to fetch avatar state' });
    }
  },

  async syncState(req: AuthenticatedRequest, res: Response) {
    try {
      const { beeDisplayName, ownedAssetIds, equippedBySlot, shopBonusCoins } = req.body ?? {};
      if (!Array.isArray(ownedAssetIds) || typeof equippedBySlot !== 'object' || equippedBySlot === null) {
        return res.status(400).json({ error: 'ownedAssetIds and equippedBySlot are required' });
      }

      const state = await avatarService.syncState(req.user!.id, {
        beeDisplayName,
        ownedAssetIds,
        equippedBySlot,
        shopBonusCoins: shopBonusCoins == null ? undefined : Number(shopBonusCoins) || 0,
      });
      res.json(state);
    } catch (error) {
      console.error('[avatar] sync error:', error);
      res.status(500).json({ error: 'Failed to sync avatar state' });
    }
  },
};
