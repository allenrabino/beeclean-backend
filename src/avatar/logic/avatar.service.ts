import { supabaseService } from '../../shared/db/supabase.service.js';

export interface AvatarStateDTO {
  beeDisplayName: string | null;
  ownedAssetIds: string[];
  equippedBySlot: Record<string, string>;
  shopBonusCoins: number;
  updatedAt: string | null;
}

export interface AvatarSyncInput {
  beeDisplayName?: string | null;
  ownedAssetIds: string[];
  equippedBySlot: Record<string, string>;
  shopBonusCoins?: number;
}

class AvatarService {
  async getState(userId: string): Promise<AvatarStateDTO> {
    const db = supabaseService.getAdminClient();
    const { data, error } = await db
      .from('user_avatar_state')
      .select('bee_display_name, owned_asset_ids, equipped_by_slot, shop_bonus_coins, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[avatar] getState error:', error.message);
      throw new Error('Failed to fetch avatar state');
    }

    if (!data) {
      return {
        beeDisplayName: null,
        ownedAssetIds: [],
        equippedBySlot: {},
        shopBonusCoins: 0,
        updatedAt: null,
      };
    }

    return {
      beeDisplayName: data.bee_display_name ?? null,
      ownedAssetIds: Array.isArray(data.owned_asset_ids) ? data.owned_asset_ids : [],
      equippedBySlot: (data.equipped_by_slot as Record<string, string>) ?? {},
      shopBonusCoins: data.shop_bonus_coins ?? 0,
      updatedAt: data.updated_at ?? null,
    };
  }

  async syncState(userId: string, input: AvatarSyncInput): Promise<AvatarStateDTO> {
    const db = supabaseService.getAdminClient();
    const payload = {
      user_id: userId,
      bee_display_name: input.beeDisplayName ?? null,
      owned_asset_ids: input.ownedAssetIds,
      equipped_by_slot: input.equippedBySlot,
      shop_bonus_coins: input.shopBonusCoins ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('user_avatar_state')
      .upsert(payload, { onConflict: 'user_id' })
      .select('bee_display_name, owned_asset_ids, equipped_by_slot, shop_bonus_coins, updated_at')
      .single();

    if (error) {
      console.error('[avatar] syncState error:', error.message);
      throw new Error('Failed to sync avatar state');
    }

    return {
      beeDisplayName: data.bee_display_name ?? null,
      ownedAssetIds: Array.isArray(data.owned_asset_ids) ? data.owned_asset_ids : [],
      equippedBySlot: (data.equipped_by_slot as Record<string, string>) ?? {},
      shopBonusCoins: data.shop_bonus_coins ?? 0,
      updatedAt: data.updated_at ?? null,
    };
  }
}

export const avatarService = new AvatarService();
