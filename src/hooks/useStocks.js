import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow } from '../utils/mapRow';

const STOCK_KEY_MAP = {
  id: 'id',
  name: 'name',
  totalCost: 'total_cost',
  shares: 'shares',
  sharesSold: 'shares_sold',
  totalCostSold: 'total_cost_sold',
  totalCostBasisSold: 'total_cost_basis_sold',
  limit4h: 'limit4h',
  needed: 'needed',
  timerEndTime: 'timer_end_time',
  category: 'category',
  position: 'position',
  onHold: ['on_hold', false],
  isInvestment: ['is_investment', false],
  itemId: ['item_id', null],
  investmentStartDate: ['investment_start_date', null],
  archived: ['archived', false],
};

const formatStock = (row) => mapRow(row, STOCK_KEY_MAP);

export function useStocks(userId) {
  const [stocks, setStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching stocks:', error);
      setStocks([]);
      setAllStocks([]);
    } else {
      const formattedStocks = (data || []).map(formatStock);
      setAllStocks(formattedStocks);
      setStocks(formattedStocks.filter(stock => !stock.archived));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchStocks();
  }, [userId, fetchStocks]);

  const reorderStocks = useCallback(async (stockId, targetStockId, category) => {
    try {
      // Optimistically update UI first
      const categoryStocks = stocks.filter(s => s.category === category);
      const movingStockIndex = categoryStocks.findIndex(s => s.id === stockId);
      const targetStockIndex = categoryStocks.findIndex(s => s.id === targetStockId);

      if (movingStockIndex === -1 || targetStockIndex === -1) return { success: false };

      // Reorder the array
      const reordered = [...categoryStocks];
      const [movingStock] = reordered.splice(movingStockIndex, 1);
      reordered.splice(targetStockIndex, 0, movingStock);

      // Update positions in a single RPC call or use upsert
      const updates = reordered.map((stock, index) => ({
        id: stock.id,
        user_id: userId,
        position: index,
        name: stock.name,
        total_cost: stock.totalCost,
        shares: stock.shares,
        shares_sold: stock.sharesSold,
        total_cost_sold: stock.totalCostSold,
        total_cost_basis_sold: stock.totalCostBasisSold,
        limit4h: stock.limit4h,
        needed: stock.needed,
        timer_end_time: stock.timerEndTime,
        category: stock.category,
        is_investment: stock.isInvestment || false,
      }));

      // Use upsert for batch update (faster than individual updates)
      const { error } = await supabase
        .from('stocks')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error reordering stocks:', error);
      throw error;
    }
  }, [userId, stocks]);

  const addStock = useCallback(async (stock) => {
    // Convert camelCase to snake_case for database
    const dbStock = {
      user_id: userId,
      name: stock.name,
      total_cost: stock.totalCost,
      shares: stock.shares,
      shares_sold: stock.sharesSold,
      total_cost_sold: stock.totalCostSold,
      total_cost_basis_sold: stock.totalCostBasisSold,
      limit4h: stock.limit4h,
      needed: stock.needed,
      timer_end_time: stock.timerEndTime,
      category: stock.category,
      is_investment: stock.isInvestment || false,
      item_id: stock.itemId || null,
      investment_start_date: stock.investmentStartDate || null,
    };

    const { data, error } = await supabase
      .from('stocks')
      .insert([dbStock])
      .select();

    if (error) {
      console.error('Error adding stock:', error);
      return null;
    } else {
      // Don't update local state - let caller refetch
      return data[0];
    }
  }, [userId]);

  const updateStock = useCallback(async (id, updates) => {
    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
    if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
    if (updates.sharesSold !== undefined) dbUpdates.shares_sold = updates.sharesSold;
    if (updates.totalCostSold !== undefined) dbUpdates.total_cost_sold = updates.totalCostSold;
    if (updates.totalCostBasisSold !== undefined) dbUpdates.total_cost_basis_sold = updates.totalCostBasisSold;
    if (updates.timerEndTime !== undefined) dbUpdates.timer_end_time = updates.timerEndTime;
    if (updates.needed !== undefined) dbUpdates.needed = updates.needed;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.limit4h !== undefined) dbUpdates.limit4h = updates.limit4h;
    if (updates.onHold !== undefined) dbUpdates.on_hold = updates.onHold;
    if (updates.isInvestment !== undefined) dbUpdates.is_investment = updates.isInvestment;
    if (updates.itemId !== undefined) dbUpdates.item_id = updates.itemId;
    if (updates.investmentStartDate !== undefined) dbUpdates.investment_start_date = updates.investmentStartDate || null;

    const { error } = await supabase
      .from('stocks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating stock:', error);
      return false;
    } else {
      // Don't update local state - let caller refetch
      return true;
    }
  }, [userId]);

  const deleteStock = useCallback(async (id) => {
    try {
      // First, delete all related transactions
      const { error: transError } = await supabase
        .from('transactions')
        .delete()
        .eq('stock_id', id)
        .eq('user_id', userId);

      if (transError) {
        console.error('Error deleting transactions:', transError);
      }

      // Then delete the stock note
      const { error: noteError } = await supabase
        .from('stock_notes')
        .delete()
        .eq('stock_id', id)
        .eq('user_id', userId);

      if (noteError) {
        console.error('Error deleting note:', noteError);
      }

      // Finally delete the stock itself
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting stock:', error);
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('Error in deleteStock:', error);
      return false;
    }
  }, [userId]);

  const archiveStock = useCallback(async (id) => {
    const { error } = await supabase
      .from('stocks')
      .update({ archived: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) { console.error('Error archiving stock:', error); return false; }
    return true;
  }, [userId]);

  const restoreStock = useCallback(async (id) => {
    const { error } = await supabase
      .from('stocks')
      .update({ archived: false })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) { console.error('Error restoring stock:', error); return false; }
    return true;
  }, [userId]);

  const fetchArchivedStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('name', { ascending: true });
    if (error) { console.error('Error fetching archived stocks:', error); return []; }
    return (data || []).map(formatStock);
  }, [userId]);

  return { stocks, allStocks, loading, addStock, updateStock, deleteStock, refetch: fetchStocks, reorderStocks, archiveStock, restoreStock, fetchArchivedStocks };
}
