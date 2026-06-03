import { supabaseService } from '../../shared/db/supabase.service.js';

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
  lifetimeItemsCleaned: number;
  lifetimeBytesSaved: number;
  totalScansCompleted: number;
  cleanScore: number;
}

interface RecordActivityInput {
  userId: string;
  action: string;
  itemCount: number;
  bytesSaved: number;
  metadata?: Record<string, unknown>;
}

interface SyncInput {
  userId: string;
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
  lifetimeItemsCleaned: number;
  lifetimeBytesSaved: number;
  totalScansCompleted: number;
  cleanScore: number;
}

interface ActivityEntry {
  action: string;
  itemCount: number;
  bytesSaved: number;
  createdAt: string;
}

const VALID_ACTIONS = ['deletion', 'scan', 'compression', 'email_cleanup', 'contact_cleanup', 'plan_generated'];

class StreakService {
  /**
   * Get the user's current streak data. Creates a record if none exists.
   */
  async getStreak(userId: string): Promise<StreakData> {
    const db = supabaseService.getAdminClient();

    const { data, error } = await db
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row — create initial record
      const initial: StreakData = {
        currentStreak: 0,
        bestStreak: 0,
        lastActivityDate: null,
        lifetimeItemsCleaned: 0,
        lifetimeBytesSaved: 0,
        totalScansCompleted: 0,
        cleanScore: 0,
      };

      await db.from('user_streaks').insert({
        user_id: userId,
        current_streak: 0,
        best_streak: 0,
        last_activity_date: null,
        lifetime_items_cleaned: 0,
        lifetime_bytes_saved: 0,
        total_scans_completed: 0,
        clean_score: 0,
      });

      return initial;
    }

    if (error) {
      console.error('[streak] Get error:', error.message);
      throw new Error('Failed to fetch streak data');
    }

    return {
      currentStreak: data.current_streak,
      bestStreak: data.best_streak,
      lastActivityDate: data.last_activity_date,
      lifetimeItemsCleaned: data.lifetime_items_cleaned,
      lifetimeBytesSaved: Number(data.lifetime_bytes_saved),
      totalScansCompleted: data.total_scans_completed,
      cleanScore: data.clean_score,
    };
  }

  /**
   * Sync streak data from the client. The client is the source of truth
   * for streak calculations (it knows the local timezone), but we persist
   * server-side for cross-device access and analytics.
   */
  async syncStreak(input: SyncInput): Promise<StreakData> {
    const db = supabaseService.getAdminClient();

    // Sanitize client-supplied counters: a buggy/off-by-one client must not be
    // able to write negative streaks or counts that would corrupt leaderboards
    // and crash UIs with no negative-case handling. Clamp to non-negative ints.
    const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

    const row = {
      current_streak: nonNeg(input.currentStreak),
      best_streak: nonNeg(input.bestStreak),
      last_activity_date: input.lastActivityDate,
      lifetime_items_cleaned: nonNeg(input.lifetimeItemsCleaned),
      lifetime_bytes_saved: nonNeg(input.lifetimeBytesSaved),
      total_scans_completed: nonNeg(input.totalScansCompleted),
      clean_score: nonNeg(input.cleanScore),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('user_streaks')
      .upsert({ user_id: input.userId, ...row }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[streak] Sync error:', error.message);
      throw new Error('Failed to sync streak data');
    }

    console.log(`[streak] Synced: user=${input.userId} streak=${input.currentStreak} best=${input.bestStreak}`);

    return {
      currentStreak: data.current_streak,
      bestStreak: data.best_streak,
      lastActivityDate: data.last_activity_date,
      lifetimeItemsCleaned: data.lifetime_items_cleaned,
      lifetimeBytesSaved: Number(data.lifetime_bytes_saved),
      totalScansCompleted: data.total_scans_completed,
      cleanScore: data.clean_score,
    };
  }

  /**
   * Record an individual activity for analytics/history.
   */
  async recordActivity(input: RecordActivityInput): Promise<{ logged: true }> {
    // The client tags actions with the cleanup category, e.g.
    // "deletion:duplicates" / "compression:longVideos", so the Progress
    // chart can filter by source. Validate against the BASE action (before
    // the ":category" suffix) — otherwise every tagged cleanup was rejected
    // with a 400 and the activity log never populated. The full tagged
    // string is still persisted so the category survives the round-trip.
    const baseAction = input.action.split(':')[0];
    if (!VALID_ACTIONS.includes(baseAction)) {
      const err = new Error(`Invalid action: ${input.action}. Valid: ${VALID_ACTIONS.join(', ')}`);
      (err as any).status = 400;
      throw err;
    }

    const db = supabaseService.getAdminClient();

    const { error } = await db.from('streak_activities').insert({
      user_id: input.userId,
      action: input.action,
      item_count: input.itemCount,
      bytes_saved: input.bytesSaved,
      metadata: input.metadata || null,
    });

    if (error) {
      console.error('[streak] Activity log error:', error.message);
      throw new Error('Failed to log activity');
    }

    return { logged: true };
  }

  /**
   * Get recent activity history for the user.
   */
  async getActivities(userId: string, limit = 50): Promise<ActivityEntry[]> {
    const db = supabaseService.getAdminClient();

    const { data, error } = await db
      .from('streak_activities')
      .select('action, item_count, bytes_saved, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[streak] Activities query error:', error.message);
      throw new Error('Failed to fetch activities');
    }

    return (data || []).map(row => ({
      action: row.action,
      itemCount: row.item_count,
      bytesSaved: Number(row.bytes_saved),
      createdAt: row.created_at,
    }));
  }
}

export const streakService = new StreakService();
