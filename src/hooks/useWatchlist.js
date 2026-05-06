import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow } from '../utils/mapRow';

const WATCHLIST_KEY_MAP = {
  id: 'id',
  itemId: 'item_id',
  itemName: 'item_name',
  targetBuyPrice: ['target_buy_price', null],
  targetSellPrice: ['target_sell_price', null],
  notes: ['notes', ''],
  createdAt: ['created_at', null],
  updatedAt: ['updated_at', null],
};

const formatWatchlistItem = (row) => mapRow(row, WATCHLIST_KEY_MAP);

export function useWatchlist(userId) {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist items:', error);
      setWatchlistItems([]);
    } else {
      setWatchlistItems((data || []).map(formatWatchlistItem));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchWatchlist();
  }, [userId, fetchWatchlist]);

  const addWatchlistItem = useCallback(async (item) => {
    if (!item?.targetBuyPrice && !item?.targetSellPrice) {
      console.error('Error adding watchlist item: missing both target prices', item);
      return false;
    }

    const { error } = await supabase
      .from('watchlist_items')
      .insert({
        user_id: userId,
        item_id: item.itemId,
        item_name: item.itemName,
        target_buy_price: item.targetBuyPrice ?? null,
        target_sell_price: item.targetSellPrice ?? null,
        notes: item.notes?.trim() || null,
      });

    if (error) {
      console.error('Error adding watchlist item:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }
    return true;
  }, [userId]);

  const updateWatchlistItem = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if (updates.targetBuyPrice !== undefined) dbUpdates.target_buy_price = updates.targetBuyPrice;
    if (updates.targetSellPrice !== undefined) dbUpdates.target_sell_price = updates.targetSellPrice;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes?.trim() || null;

    const { error } = await supabase
      .from('watchlist_items')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating watchlist item:', error);
      return false;
    }
    return true;
  }, [userId]);

  const deleteWatchlistItem = useCallback(async (id) => {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting watchlist item:', error);
      return false;
    }
    return true;
  }, [userId]);

  return {
    watchlistItems,
    loading,
    addWatchlistItem,
    updateWatchlistItem,
    deleteWatchlistItem,
    refetch: fetchWatchlist,
  };
}
