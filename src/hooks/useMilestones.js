import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PRESET_GOALS = [10000000, 50000000, 100000000, 500000000, 1000000000]; // 10M, 50M, 100M, 500M, 1B

// --- Period helpers ---

const getPeriodStart = (date, period) => {
  const d = new Date(date);
  switch (period) {
    case 'day':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'week': {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday = start
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    default:
      return d;
  }
};

const getPeriodEnd = (periodStart, period) => {
  const d = new Date(periodStart);
  switch (period) {
    case 'day':
      d.setDate(d.getDate() + 1);
      return d;
    case 'week':
      d.setDate(d.getDate() + 7);
      return d;
    case 'month':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'year':
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      return d;
  }
};

// Returns all completed period start dates between minDate and now (exclusive current period)
const generatePastPeriods = (period, minDate) => {
  const now = new Date();
  const currentPeriodStart = getPeriodStart(now, period);
  const periods = [];

  let cursor = getPeriodStart(minDate, period);
  while (cursor < currentPeriodStart) {
    periods.push(new Date(cursor));
    cursor = getPeriodEnd(cursor, period);
  }

  return periods;
};

// Convert a Date to a YYYY-MM-DD string (local time)
const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  useEffect(() => {
    if (!userId) return;
    fetchMilestones();
    fetchMilestoneHistory();
  }, [userId]);

  const fetchMilestones = async () => {
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
  };

  const fetchMilestoneHistory = async () => {
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
  };

  const updateMilestone = async (period, goal, enabled) => {
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
  };

  const recordMilestoneAchievement = async (period, goalAmount, actualAmount) => {
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
  };

  // Scans profitHistory to backfill milestone_history for all completed past periods.
  // Safe to call repeatedly — skips periods already recorded.
  const recordCompletedPeriods = async (profitHistory, currentMilestones) => {
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

      // Fetch already-recorded period_starts for this user+period
      const { data: existing } = await supabase
        .from('milestone_history')
        .select('period_start')
        .eq('user_id', userId)
        .eq('period', period);

      const existingStarts = new Set((existing || []).map(r => r.period_start));

      const toInsert = [];
      for (const periodStart of pastPeriods) {
        const periodStartStr = toDateString(periodStart);
        if (existingStarts.has(periodStartStr)) continue;

        const periodEnd = getPeriodEnd(periodStart, period);

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
          .upsert(toInsert, { onConflict: 'user_id,period,period_start', ignoreDuplicates: true });

        if (error) {
          console.error(`Error recording milestone history for ${period}:`, error);
        }
      }
    }

    await fetchMilestoneHistory();
  };

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
