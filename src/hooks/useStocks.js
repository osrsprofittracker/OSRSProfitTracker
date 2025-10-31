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
    } else {
      setStocks(data);
    }
    setLoading(false);
  };

  const addStock = async (stock) => {
    const { data, error } = await supabase
      .from('stocks')
      .insert([{ ...stock, user_id: userId }])
      .select();
    
    if (error) {
      console.error('Error adding stock:', error);
    } else {
      setStocks([...stocks, data[0]]);
    }
  };

  const updateStock = async (id, updates) => {
    const { error } = await supabase
      .from('stocks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating stock:', error);
    } else {
      setStocks(stocks.map(s => s.id === id ? { ...s, ...updates } : s));
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
    } else {
      setStocks(stocks.filter(s => s.id !== id));
    }
  };

  return { stocks, loading, addStock, updateStock, deleteStock, refetch: fetchStocks };
}