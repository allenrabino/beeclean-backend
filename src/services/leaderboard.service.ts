import { supabaseService } from './supabase.service.js';

export interface LeaderboardRowDTO {
  userId: string;
  rank: number;
  displayName: string;
  coins: number;
  storageFreedGB: number;
  streak: number;
  equippedAssetIds: string[];
}

export interface LeaderboardSelfDTO {
  entry: LeaderboardRowDTO | null;
  inTop100: boolean;
  coinsToNextRank: number | null;
  progressToNextRank: number;
  coinsToTop100: number | null;
  totalRankedUsers: number;
}

export interface LeaderboardResponseDTO {
  top100: LeaderboardRowDTO[];
  self: LeaderboardSelfDTO;
}

type ScoreRow = {
  user_id: string;
  display_name: string;
  coins: number;
  lifetime_bytes_saved: number | string;
  current_streak: number;
  equipped_by_slot: Record<string, string> | null;
};

function equippedIdsFromSlotMap(map: Record<string, string> | null | undefined): string[] {
  if (!map) return [];
  return Object.values(map).filter(Boolean);
}

function bytesToGB(bytes: number | string): number {
  const n = typeof bytes === 'string' ? Number(bytes) : bytes;
  return Math.max(0, n / 1_000_000_000);
}

function toRow(row: ScoreRow, rank: number): LeaderboardRowDTO {
  return {
    userId: row.user_id,
    rank,
    displayName: row.display_name,
    coins: row.coins,
    storageFreedGB: Number(bytesToGB(row.lifetime_bytes_saved).toFixed(2)),
    streak: row.current_streak ?? 0,
    equippedAssetIds: equippedIdsFromSlotMap(row.equipped_by_slot),
  };
}

class LeaderboardService {
  private async fetchAllScores(): Promise<ScoreRow[]> {
    const db = supabaseService.getAdminClient();
    const { data, error } = await db
      .from('leaderboard_scores')
      .select('user_id, display_name, coins, lifetime_bytes_saved, current_streak, equipped_by_slot')
      .order('coins', { ascending: false })
      .order('lifetime_bytes_saved', { ascending: false });

    if (error) {
      console.error('[leaderboard] fetch scores error:', error.message);
      throw new Error('Failed to fetch leaderboard');
    }

    return (data ?? []) as ScoreRow[];
  }

  async getLeaderboard(userId?: string): Promise<LeaderboardResponseDTO> {
    const scores = await this.fetchAllScores();
    const ranked = scores.map((row, index) => toRow(row, index + 1));
    const top100 = ranked.slice(0, 100);

    if (!userId) {
      return {
        top100,
        self: {
          entry: null,
          inTop100: false,
          coinsToNextRank: null,
          progressToNextRank: 0,
          coinsToTop100: top100.length >= 100 ? top100[99].coins : null,
          totalRankedUsers: ranked.length,
        },
      };
    }

    const selfIndex = ranked.findIndex(r => r.userId === userId);
    const selfEntry = selfIndex >= 0 ? ranked[selfIndex] : null;
    const inTop100 = selfIndex >= 0 && selfIndex < 100;

    let coinsToNextRank: number | null = null;
    let progressToNextRank = 0;

    if (selfEntry && selfIndex > 0) {
      const above = ranked[selfIndex - 1];
      coinsToNextRank = Math.max(0, above.coins - selfEntry.coins + 1);
      const span = above.coins - selfEntry.coins + 1;
      progressToNextRank = span > 0 ? 1 - (coinsToNextRank / span) : 1;
    } else if (selfEntry && selfIndex === 0) {
      progressToNextRank = 1;
    }

    let coinsToTop100: number | null = null;
    if (selfEntry && !inTop100 && top100.length >= 100) {
      const cutoff = top100[99];
      coinsToTop100 = Math.max(0, cutoff.coins - selfEntry.coins + 1);
    } else if (selfEntry && inTop100) {
      coinsToTop100 = 0;
    } else if (!selfEntry && top100.length >= 100) {
      coinsToTop100 = top100[99].coins;
    }

    return {
      top100,
      self: {
        entry: selfEntry,
        inTop100,
        coinsToNextRank,
        progressToNextRank: Math.min(1, Math.max(0, progressToNextRank)),
        coinsToTop100,
        totalRankedUsers: ranked.length,
      },
    };
  }
}

export const leaderboardService = new LeaderboardService();
