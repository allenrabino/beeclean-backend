import { Response } from 'express';
import { contactsService } from './contacts.service.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';

// Defensive upper bound — anything larger is almost certainly a client
// bug or replay, so we clamp instead of storing junk.
const MAX_CONTACT_COUNT = 500_000;

const VALID_ACTIONS = new Set(['merge', 'delete', 'export', 'backup', 'restore']);

export const contactsController = {
  // POST /contacts/stats — Log a contact cleanup action
  async logStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { action, contactCount, duplicateGroupsMerged, metadata } = req.body;

      if (!action || typeof action !== 'string') {
        return res.status(400).json({
          error: `action is required (one of: ${[...VALID_ACTIONS].join(', ')})`,
        });
      }

      const normalizedAction = action.trim().toLowerCase();
      if (!VALID_ACTIONS.has(normalizedAction)) {
        return res.status(400).json({
          error: `invalid action; must be one of: ${[...VALID_ACTIONS].join(', ')}`,
        });
      }

      const safeCount = Math.min(
        MAX_CONTACT_COUNT,
        Math.max(0, Math.floor(Number(contactCount) || 1))
      );
      const safeGroupsMerged = duplicateGroupsMerged != null
        ? Math.min(MAX_CONTACT_COUNT, Math.max(0, Math.floor(Number(duplicateGroupsMerged))))
        : null;

      // logAction never throws — it returns a result. Stats failures
      // must NOT surface as 5xx because iOS calls this fire-and-forget
      // and the core action already succeeded locally on the device.
      const result = await contactsService.logAction(
        req.user!.id,
        normalizedAction,
        safeCount,
        safeGroupsMerged,
        metadata
      );
      res.json(result);
    } catch (error: any) {
      // Defense-in-depth: if something truly unexpected reaches here,
      // still return 200 with a reason so the client doesn't retry-storm.
      console.error('[contacts/stats] Unexpected controller error:', error);
      res.json({
        logged: false,
        reason: error?.message || 'unexpected error',
        code: 'STATS_CONTROLLER_ERROR',
      });
    }
  },

  // GET /contacts/stats — Get user's contact cleanup summary
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await contactsService.getStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error('[contacts/stats] Error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },
};
