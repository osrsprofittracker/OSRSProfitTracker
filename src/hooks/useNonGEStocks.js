import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow } from '../utils/mapRow';

const NON_GE_STOCK_KEY_MAP = {
  id: 'id',
  catalogItemKey: ['catalog_item_key', null],
  customItemId: ['custom_item_id', null],
  nameSnapshot: 'name_snapshot',
  categoryId: ['category_id', null],
  shares: ['shares', 0],
  totalCost: ['total_cost', 0],
  sharesSold: ['shares_sold', 0],
  totalCostSold: ['total_cost_sold', 0],
  totalCostBasisSold: ['total_cost_basis_sold', 0],
  targetBuyPrice: ['target_buy_price', null],
  targetSellPrice: ['target_sell_price', null],
  notes: ['notes', ''],
  position: ['position', 0],
  archived: ['archived', false],
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const formatStock = (row) => mapRow(row, NON_GE_STOCK_KEY_MAP);

function toDbStock(stock, userId) {
  const dbStock = {
    user_id: userId,
    catalog_item_key: stock.catalogItemKey || null,
    custom_item_id: stock.customItemId || null,
    name_snapshot: stock.nameSnapshot,
    category_id: stock.categoryId || null,
    shares: stock.shares ?? 0,
    total_cost: stock.totalCost ?? 0,
    shares_sold: stock.sharesSold ?? 0,
    total_cost_sold: stock.totalCostSold ?? 0,
    total_cost_basis_sold: stock.totalCostBasisSold ?? 0,
    target_buy_price: stock.targetBuyPrice ?? null,
    target_sell_price: stock.targetSellPrice ?? null,
    notes: stock.notes || null,
    position: stock.position ?? 0,
    archived: stock.archived || false,
  };

  if (stock.id !== undefined) dbStock.id = stock.id;

  return dbStock;
}

function toDbUpdates(updates) {
  const dbUpdates = {};

  if (updates.catalogItemKey !== undefined) dbUpdates.catalog_item_key = updates.catalogItemKey || null;
  if (updates.customItemId !== undefined) dbUpdates.custom_item_id = updates.customItemId || null;
  if (updates.nameSnapshot !== undefined) dbUpdates.name_snapshot = updates.nameSnapshot;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
  if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
  if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
  if (updates.sharesSold !== undefined) dbUpdates.shares_sold = updates.sharesSold;
  if (updates.totalCostSold !== undefined) dbUpdates.total_cost_sold = updates.totalCostSold;
  if (updates.totalCostBasisSold !== undefined) dbUpdates.total_cost_basis_sold = updates.totalCostBasisSold;
  if (updates.targetBuyPrice !== undefined) dbUpdates.target_buy_price = updates.targetBuyPrice ?? null;
  if (updates.targetSellPrice !== undefined) dbUpdates.target_sell_price = updates.targetSellPrice ?? null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  if (updates.archived !== undefined) dbUpdates.archived = updates.archived;

  return dbUpdates;
}

export function useNonGEStocks(userId) {
  const [stocks, setStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    if (!userId) {
      setStocks([]);
      setAllStocks([]);
      setLoading(false);
      return [];
    }

    const { data, error } = await supabase
      .from('non_ge_stocks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching Non-GE stocks:', error);
      setStocks([]);
      setAllStocks([]);
      setLoading(false);
      return [];
    }

    const formattedStocks = (data || []).map(formatStock);
    setAllStocks(formattedStocks);
    setStocks(formattedStocks.filter(stock => !stock.archived));
    setLoading(false);
    return formattedStocks;
  }, [userId]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const addStock = useCallback(async (stock) => {
    const dbStock = toDbStock({
      ...stock,
      position: stock.position ?? stocks.length,
    }, userId);

    const { data, error } = await supabase
      .from('non_ge_stocks')
      .insert([dbStock])
      .select()
      .single();

    if (error) {
      console.error('Error adding Non-GE stock:', error);
      return null;
    }

    return formatStock(data);
  }, [userId, stocks.length]);

  const updateStock = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('non_ge_stocks')
      .update(toDbUpdates(updates))
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating Non-GE stock:', error);
      return false;
    }

    return true;
  }, [userId]);

  const deleteStock = useCallback(async (id) => {
    const { error } = await supabase
      .from('non_ge_stocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting Non-GE stock:', error);
      return false;
    }

    return true;
  }, [userId]);

  const archiveStock = useCallback(async (id) => {
    const { error } = await supabase
      .from('non_ge_stocks')
      .update({ archived: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error archiving Non-GE stock:', error);
      return false;
    }

    return true;
  }, [userId]);

  const restoreStock = useCallback(async (id) => {
    const { error } = await supabase
      .from('non_ge_stocks')
      .update({ archived: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error restoring Non-GE stock:', error);
      return false;
    }

    return true;
  }, [userId]);

  const fetchArchivedStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('non_ge_stocks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('name_snapshot', { ascending: true });

    if (error) {
      console.error('Error fetching archived Non-GE stocks:', error);
      return [];
    }

    return (data || []).map(formatStock);
  }, [userId]);

  const reorderStocks = useCallback(async (stockId, targetStockId, categoryId = null) => {
    try {
      const categoryStocks = stocks.filter(stock => stock.categoryId === categoryId);
      const movingStockIndex = categoryStocks.findIndex(stock => stock.id === stockId);
      const targetStockIndex = categoryStocks.findIndex(stock => stock.id === targetStockId);

      if (movingStockIndex === -1 || targetStockIndex === -1) return { success: false };

      const reordered = [...categoryStocks];
      const [movingStock] = reordered.splice(movingStockIndex, 1);
      reordered.splice(targetStockIndex, 0, movingStock);

      const updates = reordered.map((stock, index) => toDbStock({
        ...stock,
        position: index,
      }, userId));

      const { error } = await supabase
        .from('non_ge_stocks')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error reordering Non-GE stocks:', error);
      throw error;
    }
  }, [userId, stocks]);

  return {
    stocks,
    allStocks,
    loading,
    addStock,
    updateStock,
    deleteStock,
    archiveStock,
    restoreStock,
    fetchArchivedStocks,
    reorderStocks,
    refetch: fetchStocks,
  };
}
