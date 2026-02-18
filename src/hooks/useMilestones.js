import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PRESET_GOALS = [10000000, 50000000, 100000000, 500000000, 1000000000]; // 10M, 50M, 100M, 500M, 1B

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
      .order('achieved_at', { ascending: false })
      .limit(50);

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

  return {
    milestones,
    milestoneHistory,
    loading,
    updateMilestone,
    recordMilestoneAchievement,
    refetch: fetchMilestones,
    PRESET_GOALS
  };
}