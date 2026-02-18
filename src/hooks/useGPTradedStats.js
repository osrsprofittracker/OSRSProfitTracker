import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGPTradedStats(userId) {
  const [stats, setStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchGPTradedStats();
  }, [userId]);

  const fetchGPTradedStats = async () => {
    const getStartOfPeriod = (period) => {
      const date = new Date();
      switch (period) {
        case 'day':
          date.setHours(0, 0, 0, 0);
          return date.toISOString();
        case 'week':
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          date.setDate(diff);
          date.setHours(0, 0, 0, 0);
          return date.toISOString();
        case 'month':
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return date.toISOString();
        case 'year':
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          return date.toISOString();
        default:
          return null;
      }
    };

    try {
      // Helper function to fetch ALL transactions with pagination
      const fetchAllTransactions = async (startDate = null) => {
        let allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('transactions')
            .select('total')
            .eq('user_id', userId)
            .range(from, from + batchSize - 1);

          if (startDate) {
            query = query.gte('date', startDate);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching transactions batch:', error);
            break;
          }

          if (data && data.length > 0) {
            allData = allData.concat(data);
            from += batchSize;
            hasMore = data.length === batchSize; // Continue if we got a full batch
          } else {
            hasMore = false;
          }
        }

        return allData;
      };

      // Fetch all data for each period with pagination
      const [dailyData, weeklyData, monthlyData, yearlyData, totalData] = await Promise.all([
        fetchAllTransactions(getStartOfPeriod('day')),
        fetchAllTransactions(getStartOfPeriod('week')),
        fetchAllTransactions(getStartOfPeriod('month')),
        fetchAllTransactions(getStartOfPeriod('year')),
        fetchAllTransactions(null) // null = all time
      ]);

      const stats = {
        daily: dailyData.reduce((sum, t) => sum + (t.total || 0), 0),
        weekly: weeklyData.reduce((sum, t) => sum + (t.total || 0), 0),
        monthly: monthlyData.reduce((sum, t) => sum + (t.total || 0), 0),
        yearly: yearlyData.reduce((sum, t) => sum + (t.total || 0), 0),
        total: totalData.reduce((sum, t) => sum + (t.total || 0), 0)
      };

      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching GP traded stats:', error);
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchGPTradedStats };
}