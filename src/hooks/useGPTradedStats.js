import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const GP_TRADED_FALLBACK_ROW_CAP = 10000;

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function useGPTradedStats(userId) {
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchGPTradedStats = useCallback(async () => {
    if (!userId) {
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

    const buildStatsFromRows = (rows, totalOverride = null) => {
      const nextStats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0
      };

      for (const row of rows || []) {
        const rowDate = String(row.bucket_date || row.date || '').slice(0, 10);
        const gpTraded = Number(row.gp_traded ?? row.total) || 0;

        nextStats.total += gpTraded;
        if (rowDate >= yearlyStart) nextStats.yearly += gpTraded;
        if (rowDate >= monthlyStart) nextStats.monthly += gpTraded;
        if (rowDate >= weeklyStart) nextStats.weekly += gpTraded;
        if (rowDate >= dailyStart) nextStats.daily += gpTraded;
      }

      if (totalOverride !== null) {
        nextStats.total = totalOverride;
      }

      return nextStats;
    };

    const fetchBoundedStats = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('date,total')
        .eq('user_id', userId)
        .gte('date', yearlyStart)
        .order('date', { ascending: false })
        .limit(GP_TRADED_FALLBACK_ROW_CAP);

      if (error) {
        console.error('Error fetching bounded GP traded fallback:', error);
        return null;
      }

      const yearlyStats = buildStatsFromRows(data || []);
      return { ...yearlyStats, total: yearlyStats.yearly };
    };

    try {
      setLoading(true);
      const boundedStats = await fetchBoundedStats();
      if (boundedStats) {
        setStats(boundedStats);
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
