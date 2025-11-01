import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useStocks(userId) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchStocks();
  }, [userId]);

  const fetchStocks = async () => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching stocks:', error);
      setStocks([]);
    } else {
      const formattedStocks = (data || []).map(stock => ({
        id: stock.id,
        name: stock.name,
        totalCost: stock.total_cost,
        shares: stock.shares,
        sharesSold: stock.shares_sold,
        totalCostSold: stock.total_cost_sold,
        totalCostBasisSold: stock.total_cost_basis_sold,
        limit4h: stock.limit4h,
        needed: stock.needed,
        timerEndTime: stock.timer_end_time,
        category: stock.category,
        position: stock.position
      }));
      setStocks(formattedStocks);
    }
    setLoading(false);
  };

  const reorderStocks = async (stockId, targetStockId, category) => {
  try {
    // Get all stocks in this category ordered by position
    const { data: categoryStocks, error: fetchError } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('position', { ascending: true });

    if (fetchError) throw fetchError;

    const movingStockIndex = categoryStocks.findIndex(s => s.id === stockId);
    const targetStockIndex = categoryStocks.findIndex(s => s.id === targetStockId);

    if (movingStockIndex === -1 || targetStockIndex === -1) return { success: false };

    // Reorder the array
    const reordered = [...categoryStocks];
    const [movingStock] = reordered.splice(movingStockIndex, 1);
    reordered.splice(targetStockIndex, 0, movingStock);

    // Update all positions
    const updates = reordered.map((stock, index) => ({
      id: stock.id,
      position: index
    }));

    // Update each stock's position
    for (const update of updates) {
      const { error } = await supabase
        .from('stocks')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('user_id', userId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error reordering stocks:', error);
    throw error;
  }
};

  const addStock = async (stock) => {
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
      category: stock.category
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
  };

  const updateStock = async (id, updates) => {
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
  };

  const deleteStock = async (id) => {
    const { error } = await supabase
      .from('stocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting stock:', error);
      return false;
    } else {
      // Don't update local state - let caller refetch
      return true;
    }
  };

  return { stocks, loading, addStock, updateStock, deleteStock, refetch: fetchStocks, reorderStocks };
}