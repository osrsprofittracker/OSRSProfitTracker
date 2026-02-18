import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProfitHistory(userId) {
  const [profitHistory, setProfitHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProfitHistory();
  }, [userId]);

  const fetchProfitHistory = async () => {
    const { data, error } = await supabase
      .from('profit_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profit history:', error);
      setLoading(false);
      return;
    }

    setProfitHistory(data || []);
    setLoading(false);
  };

  const addProfitEntry = async (profitType, amount, stockId = null) => {
    const { error } = await supabase
      .from('profit_history')
      .insert([{
        user_id: userId,
        profit_type: profitType,
        amount: Math.round(Number(amount)),
        stock_id: stockId,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error adding profit entry:', error);
      return false;
    }

    await fetchProfitHistory();
    return true;
  };

  return { profitHistory, loading, addProfitEntry, refetch: fetchProfitHistory };
}