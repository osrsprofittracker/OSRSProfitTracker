import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatLocalDate, getLocalPeriodEnd, getLocalPeriodStart } from '../utils/localPeriods';

const PRESET_GOALS = [10000000, 50000000, 100000000, 500000000, 1000000000]; // 10M, 50M, 100M, 500M, 1B

// --- Period helpers ---

// Returns all completed period start dates between minDate and now (exclusive current period)
const generatePastPeriods = (period, minDate) => {
  const now = new Date();
  const currentPeriodStart = getLocalPeriodStart(now, period);
  const periods = [];

  let cursor = getLocalPeriodStart(minDate, period);
  while (cursor < currentPeriodStart) {
    periods.push(new Date(cursor));
    cursor = getLocalPeriodEnd(cursor, period);
  }

  return periods;
};

// ---

export function useMilestones(userId) {
  const [milestones, setMilestones] = useState({
    day: { goal: 10000000, enabled: true },
    week: { goal: 50000000, enabled: true },
    month: { goal: 100000000, enabled: true },
    year: { goal: 500000000, enabled: true }
  });
  const [milestoneHistory, setMilestoneHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestoneHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('milestone_history')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false });

    if (error) {
      console.error('Error fetching milestone history:', error);
      return;
    }

    setMilestoneHistory(data || []);
  }, [userId]);

  const fetchMilestones = useCallback(async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching milestones:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setMilestones({
        day: data.day_milestone || { goal: 10000000, enabled: true },
        week: data.week_milestone || { goal: 50000000, enabled: true },
        month: data.month_milestone || { goal: 100000000, enabled: true },
        year: data.year_milestone || { goal: 500000000, enabled: true }
      });
    } else {
      // Create initial milestones
      await supabase.from('milestones').insert([{
        user_id: userId,
        day_milestone: { goal: 10000000, enabled: true },
        week_milestone: { goal: 50000000, enabled: true },
        month_milestone: { goal: 100000000, enabled: true },
        year_milestone: { goal: 500000000, enabled: true }
      }]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchMilestones();
    fetchMilestoneHistory();
  }, [userId, fetchMilestones, fetchMilestoneHistory]);

  const updateMilestone = useCallback(async (period, goal, enabled) => {
    const newMilestones = {
      ...milestones,
      [period]: { goal, enabled }
    };

    const dbData = {
      user_id: userId,
      day_milestone: newMilestones.day,
      week_milestone: newMilestones.week,
      month_milestone: newMilestones.month,
      year_milestone: newMilestones.year
    };

    const { error } = await supabase
      .from('milestones')
      .upsert(dbData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating milestone:', error);
      return false;
    }

    setMilestones(newMilestones);
    return true;
  }, [userId, milestones]);

  const recordMilestoneAchievement = useCallback(async (period, goalAmount, actualAmount) => {
    const { error } = await supabase
      .from('milestone_history')
      .insert([{
        user_id: userId,
        period,
        goal_amount: goalAmount,
        actual_amount: actualAmount,
        achieved_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error recording milestone achievement:', error);
      return false;
    }

    await fetchMilestoneHistory();
    return true;
  }, [userId, fetchMilestoneHistory]);

  // Scans profitHistory to upsert milestone_history for all completed past periods.
  // Safe to call repeatedly because completed period rows are keyed by period_start.
  const recordCompletedPeriods = useCallback(async (profitHistory, currentMilestones) => {
    if (!profitHistory || profitHistory.length === 0) return;

    // Earliest entry date, capped at 1 year back
    const entryDates = profitHistory.map(e => new Date(e.created_at).getTime());
    const minDate = new Date(Math.min(...entryDates));
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const effectiveMinDate = minDate < oneYearAgo ? oneYearAgo : minDate;

    const periodTypes = ['day', 'week', 'month', 'year'];

    for (const period of periodTypes) {
      const goalAmount = currentMilestones[period]?.goal || 0;
      const pastPeriods = generatePastPeriods(period, effectiveMinDate);
      if (pastPeriods.length === 0) continue;

      const toInsert = [];
      for (const periodStart of pastPeriods) {
        const periodStartStr = formatLocalDate(periodStart);

        const periodEnd = getLocalPeriodEnd(periodStart, period);

        const actualAmount = profitHistory
          .filter(entry => {
            const d = new Date(entry.created_at);
            return d >= periodStart && d < periodEnd && entry.profit_type !== 'bonds';
          })
          .reduce((sum, entry) => sum + entry.amount, 0);

        toInsert.push({
          user_id: userId,
          period,
          period_start: periodStartStr,
          goal_amount: goalAmount,
          actual_amount: actualAmount,
          achieved_at: periodEnd.toISOString()
        });
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('milestone_history')
          .upsert(toInsert, { onConflict: 'user_id,period,period_start' });

        if (error) {
          console.error(`Error recording milestone history for ${period}:`, error);
        }
      }
    }

    await fetchMilestoneHistory();
  }, [userId, fetchMilestoneHistory]);

  return {
    milestones,
    milestoneHistory,
    loading,
    updateMilestone,
    recordMilestoneAchievement,
    recordCompletedPeriods,
    refetch: fetchMilestones,
    PRESET_GOALS
  };
}
