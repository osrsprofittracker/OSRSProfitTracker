import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const GP_TRADED_BATCH_SIZE = 1000;

const EMPTY_STATS = {
  daily: 0,
  weekly: 0,
  monthly: 0,
  yearly: 0,
  total: 0
};

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function useGPTradedStats(userId) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const fetchGPTradedStats = useCallback(async () => {
    if (!userId) {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    const getStartOfPeriod = (period) => {
      const date = new Date();
      switch (period) {
        case 'day':
          date.setHours(0, 0, 0, 0);
          return toIsoDate(date);
        case 'week':
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          date.setDate(diff);
          date.setHours(0, 0, 0, 0);
          return toIsoDate(date);
        case 'month':
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return toIsoDate(date);
        case 'year':
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          return toIsoDate(date);
        default:
          return null;
      }
    };

    const dailyStart = getStartOfPeriod('day');
    const weeklyStart = getStartOfPeriod('week');
    const monthlyStart = getStartOfPeriod('month');
    const yearlyStart = getStartOfPeriod('year');

    const buildStatsFromRows = (rows) => {
      const nextStats = { ...EMPTY_STATS };

      for (const row of rows || []) {
        const rowDate = String(row.bucket_date || row.date || '').slice(0, 10);
        const gpTraded = Number(row.gp_traded ?? row.total) || 0;

        nextStats.total += gpTraded;
        if (rowDate >= yearlyStart) nextStats.yearly += gpTraded;
        if (rowDate >= monthlyStart) nextStats.monthly += gpTraded;
        if (rowDate >= weeklyStart) nextStats.weekly += gpTraded;
        if (rowDate >= dailyStart) nextStats.daily += gpTraded;
      }

      return nextStats;
    };

    const fetchAggregateTotal = async (startDate = null) => {
      let query = supabase
        .from('transactions')
        .select('gp_traded:total.sum()')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('date', startDate);
      }

      const { data, error } = await query;

      if (error) {
        return null;
      }

      return Number(data?.[0]?.gp_traded) || 0;
    };

    const fetchRowsSince = async (startDate = null) => {
      const rows = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('transactions')
          .select('date,total')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('id', { ascending: false });

        if (startDate) {
          query = query.gte('date', startDate);
        }

        const { data, error } = await query.range(from, from + GP_TRADED_BATCH_SIZE - 1);

        if (error) {
          console.error('Error fetching GP traded rows:', error);
          return null;
        }

        rows.push(...(data || []));
        hasMore = (data || []).length === GP_TRADED_BATCH_SIZE;
        from += GP_TRADED_BATCH_SIZE;
      }

      return rows;
    };

    const fetchStatsFromRows = async () => {
      const allRows = await fetchRowsSince();
      if (!allRows) return null;

      return buildStatsFromRows(allRows);
    };

    const fetchStatsFromAggregates = async () => {
      const [daily, weekly, monthly, yearly, total] = await Promise.all([
        fetchAggregateTotal(dailyStart),
        fetchAggregateTotal(weeklyStart),
        fetchAggregateTotal(monthlyStart),
        fetchAggregateTotal(yearlyStart),
        fetchAggregateTotal()
      ]);

      if ([daily, weekly, monthly, yearly, total].some(value => value === null)) {
        return null;
      }

      return { daily, weekly, monthly, yearly, total };
    };

    try {
      setLoading(true);
      const aggregateStats = await fetchStatsFromAggregates();
      const nextStats = aggregateStats || await fetchStatsFromRows();
      if (nextStats) {
        setStats(nextStats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching GP traded stats:', error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGPTradedStats();
  }, [fetchGPTradedStats]);

  return { stats, loading, refetch: fetchGPTradedStats };
}
