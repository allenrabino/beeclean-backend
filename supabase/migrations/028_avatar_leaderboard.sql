-- Avatar inventory + leaderboard support.
-- Ranking score = user_progress.total_lifetime_coins + user_avatar_state.shop_bonus_coins

CREATE TABLE IF NOT EXISTS user_avatar_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bee_display_name TEXT,
  owned_asset_ids TEXT[] NOT NULL DEFAULT '{}',
  equipped_by_slot JSONB NOT NULL DEFAULT '{}',
  shop_bonus_coins INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_avatar_state_updated ON user_avatar_state(updated_at DESC);

-- Fast top-N leaderboard reads (coins desc, tie-breaker: bytes saved)
CREATE OR REPLACE VIEW leaderboard_scores AS
SELECT
  u.id AS user_id,
  COALESCE(NULLIF(TRIM(uas.bee_display_name), ''), NULLIF(TRIM(u.name), ''), 'BeeCleaner') AS display_name,
  COALESCE(up.total_lifetime_coins, 0) + COALESCE(uas.shop_bonus_coins, 0) AS coins,
  COALESCE(us.lifetime_bytes_saved, 0)::BIGINT AS lifetime_bytes_saved,
  COALESCE(us.current_streak, 0) AS current_streak,
  COALESCE(uas.equipped_by_slot, '{}'::JSONB) AS equipped_by_slot,
  COALESCE(uas.owned_asset_ids, '{}'::TEXT[]) AS owned_asset_ids
FROM users u
LEFT JOIN user_progress up ON up.user_id = u.id
LEFT JOIN user_streaks us ON us.user_id = u.id
LEFT JOIN user_avatar_state uas ON uas.user_id = u.id
WHERE COALESCE(up.total_lifetime_coins, 0) + COALESCE(uas.shop_bonus_coins, 0) > 0
   OR COALESCE(us.lifetime_bytes_saved, 0) > 0;
