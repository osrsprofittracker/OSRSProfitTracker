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
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching stocks:', error);
    setStocks([]);  // Set empty array on error
  } else {
    // Convert snake_case to camelCase for the app
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
      category: stock.category
    }));
    setStocks(formattedStocks);
  }
  setLoading(false);
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
      const formattedStock = {
        id: data[0].id,
        name: data[0].name,
        totalCost: data[0].total_cost,
        shares: data[0].shares,
        sharesSold: data[0].shares_sold,
        totalCostSold: data[0].total_cost_sold,
        totalCostBasisSold: data[0].total_cost_basis_sold,
        limit4h: data[0].limit4h,
        needed: data[0].needed,
        timerEndTime: data[0].timer_end_time,
        category: data[0].category
      };
      setStocks([...stocks, formattedStock]);
      return formattedStock;
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

    const { error } = await supabase
      .from('stocks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating stock:', error);
      return false;
    } else {
      setStocks(stocks.map(s => s.id === id ? { ...s, ...updates } : s));
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
      setStocks(stocks.filter(s => s.id !== id));
      return true;
    }
  };

  return { stocks, setStocks, loading, addStock, updateStock, deleteStock, refetch: fetchStocks };
}