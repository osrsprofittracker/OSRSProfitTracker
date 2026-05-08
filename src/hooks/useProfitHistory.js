import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RECENT_PROFIT_HISTORY_WINDOW_DAYS = 365;
const RECENT_PROFIT_HISTORY_ROW_CAP = 20000;
const FULL_PROFIT_HISTORY_ROW_CAP = 50000;
const PROFIT_HISTORY_BATCH_SIZE = 1000;
const DAY_MS = 86400_000;

export function useProfitHistory(userId) {
  const [profitHistory, setProfitHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullHistoryLoading, setFullHistoryLoading] = useState(false);
  const [historyScope, setHistoryScope] = useState({
    full: false,
    since: null,
    rowCap: RECENT_PROFIT_HISTORY_ROW_CAP,
    capped: false
  });

  const fetchProfitHistory = useCallback(async (options = {}) => {
    if (!userId) {
      setProfitHistory([]);
      setLoading(false);
      return;
    }

    const { full = false } = options;
    const rowCap = full ? FULL_PROFIT_HISTORY_ROW_CAP : RECENT_PROFIT_HISTORY_ROW_CAP;
    const since = full
      ? null
      : new Date(Date.now() - RECENT_PROFIT_HISTORY_WINDOW_DAYS * DAY_MS).toISOString();
    const allData = [];
    let from = 0;
    let hasMore = true;

    setLoading(true);
    if (full) setFullHistoryLoading(true);

    while (hasMore) {
      let query = supabase
        .from('profit_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (since) {
        query = query.gte('created_at', since);
      }

      const remaining = rowCap - allData.length;
      const batchSize = Math.min(PROFIT_HISTORY_BATCH_SIZE, remaining);
      const { data, error } = await query.range(from, from + batchSize - 1);

      if (error) {
        console.error('Error fetching profit history:', error);
        setLoading(false);
        setFullHistoryLoading(false);
        return;
      }

      allData.push(...(data || []));
      hasMore = (data || []).length === batchSize && allData.length < rowCap;
      from += batchSize;
    }

    setProfitHistory(allData);
    setHistoryScope({
      full,
      since,
      rowCap,
      capped: allData.length >= rowCap
    });
    setLoading(false);
    setFullHistoryLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfitHistory();
  }, [fetchProfitHistory]);

  const loadFullHistory = useCallback(() => fetchProfitHistory({ full: true }), [fetchProfitHistory]);

  const addProfitEntry = async (profitType, amount, stockId = null, transactionId = null) => {
    const { data, error } = await supabase
      .from('profit_history')
      .insert([{
        user_id: userId,
        profit_type: profitType,
        amount: Math.round(Number(amount)),
        stock_id: stockId,
        transaction_id: transactionId,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error adding profit entry:', error);
      return false;
    }

    const inserted = data?.[0] ?? null;
    if (inserted) {
      setProfitHistory(prev => [inserted, ...prev]);
    }
    return inserted;
  };

  return {
    profitHistory,
    loading,
    addProfitEntry,
    refetch: fetchProfitHistory,
    loadFullHistory,
    fullHistoryLoading,
    historyScope
  };
}
