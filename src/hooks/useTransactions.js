import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    setTransactions([]);  // Set empty array on error
  } else {
    const formattedTransactions = (data || []).map(t => ({
      id: t.id,
      stockId: t.stock_id,
      stockName: t.stock_name,
      type: t.type,
      shares: t.shares,
      price: t.price,
      total: t.total,
      date: t.date
    }));
    setTransactions(formattedTransactions);
  }
  setLoading(false);
};

  const addTransaction = async (transaction) => {
    // Convert camelCase to snake_case
    const dbTransaction = {
      user_id: userId,
      stock_id: transaction.stockId,
      stock_name: transaction.stockName,
      type: transaction.type,
      shares: transaction.shares,
      price: transaction.price,
      total: transaction.total,
      date: transaction.date
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([dbTransaction])
      .select();
    
    if (error) {
      console.error('Error adding transaction:', error);
      return null;
    } else {
      const formatted = {
        id: data[0].id,
        stockId: data[0].stock_id,
        stockName: data[0].stock_name,
        type: data[0].type,
        shares: data[0].shares,
        price: data[0].price,
        total: data[0].total,
        date: data[0].date
      };
      setTransactions([formatted, ...transactions]);
      return formatted;
    }
  };

  return { transactions, loading, addTransaction, refetch: fetchTransactions };
}