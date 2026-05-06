// Goal-tab aggregation helpers. Operates on milestone_history rows
// shaped like { period, period_start, achieved_at, goal_amount, actual_amount }.

import { addDays, daysBetween } from './analyticsHelpers';

const HIT_RATE_WINDOW = 7;

export function computePeriodEnd(periodStartIso, period) {
  if (!periodStartIso) return periodStartIso;
  if (period === 'day') return periodStartIso;
  if (period === 'week') return addDays(periodStartIso, 6);
  if (period === 'month') {
    const [year, month] = periodStartIso.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${periodStartIso.slice(0, 8)}${String(lastDay).padStart(2, '0')}`;
  }
  if (period === 'year') return `${periodStartIso.slice(0, 4)}-12-31`;
  return periodStartIso;
}

// Returns metadata for a milestone_history row given the user's first activity date.
// proratedGoal scales row.goal_amount by the share of the period the user was active for.
// Periods entirely after the join date are not partial; periods entirely before it return
// 0 active days (defensive — the backfill hook should never insert these).
export function proratedRowGoal(row, firstActivityDate) {
  const periodStart = periodDate(row);
  const periodEnd = computePeriodEnd(periodStart, row.period);
  const totalDays = daysBetween(periodStart, periodEnd) + 1;
  const goal = row.goal_amount || 0;

  if (!firstActivityDate || periodStart >= firstActivityDate) {
    return { proratedGoal: goal, isPartial: false, totalDays, activeDays: totalDays };
  }

  if (periodEnd < firstActivityDate) {
    return { proratedGoal: goal, isPartial: true, totalDays, activeDays: 0 };
  }

  const activeDays = daysBetween(firstActivityDate, periodEnd) + 1;
  const proratedGoal = totalDays > 0 ? (goal * activeDays) / totalDays : goal;
  return { proratedGoal, isPartial: true, totalDays, activeDays };
}

// Returns history rows with goal_amount replaced by the prorated share for partial
// periods (e.g. user joined mid-year). Original goal stays available as
// original_goal_amount, and isPartial / activeDays / totalDays describe the scaling.
export function withProrating(history = [], firstActivityDate) {
  return history.map((row) => {
    const meta = proratedRowGoal(row, firstActivityDate);
    return {
      ...row,
      original_goal_amount: row.goal_amount,
      goal_amount: meta.proratedGoal,
      isPartial: meta.isPartial,
      activeDays: meta.activeDays,
      totalDays: meta.totalDays,
    };
  });
}


const isHit = (entry) => (
  (entry.actual_amount || 0) >= (entry.goal_amount || 0) && (entry.goal_amount || 0) > 0
);

export const periodDate = (entry) => (
  entry.period_start || String(entry.achieved_at || '').slice(0, 10)
);

const sortedForPeriod = (history, period) => (
  history
    .filter((entry) => entry.period === period && periodDate(entry))
    .sort((a, b) => periodDate(a).localeCompare(periodDate(b)))
);

export function computeHitRateSeries(history, period, windowSize = HIT_RATE_WINDOW) {
  const filtered = sortedForPeriod(history, period);
  const out = [];

  for (let i = 0; i < filtered.length; i += 1) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = filtered.slice(start, i + 1);
    const hits = slice.filter(isHit).length;
    out.push({
      date: periodDate(filtered[i]),
      rate: slice.length > 0 ? hits / slice.length : 0,
      windowSize: slice.length,
      hits,
    });
  }

  return out;
}

export function computeStreaks(history, period) {
  const filtered = sortedForPeriod(history, period);
  let longest = 0;
  let run = 0;
  let hits = 0;

  for (const entry of filtered) {
    if (isHit(entry)) {
      run += 1;
      hits += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = filtered.length - 1; i >= 0; i -= 1) {
    if (!isHit(filtered[i])) break;
    current += 1;
  }

  return { longest, current, hits, total: filtered.length };
}

export function computeAvgVsGoal(history, period) {
  const filtered = history.filter((entry) => entry.period === period);
  if (filtered.length === 0) return { avg: 0, goal: 0, deltaPct: null, samples: 0 };

  const avg = filtered.reduce((sum, entry) => sum + (entry.actual_amount || 0), 0) / filtered.length;
  const goal = filtered.reduce((sum, entry) => sum + (entry.goal_amount || 0), 0) / filtered.length;
  const deltaPct = goal > 0 ? ((avg - goal) / goal) * 100 : null;

  return { avg, goal, deltaPct, samples: filtered.length };
}

// currentProgress: GP earned in the in-progress period so far
// goal: GP target for the period
// elapsedDays: portion of the period already elapsed (fractional days)
// totalDays: length of the period in calendar days
export function estimateTimeToGoal({ currentProgress, goal, elapsedDays, totalDays }) {
  if (!goal || goal <= 0 || !elapsedDays || elapsedDays <= 0) {
    return { daysRemaining: null, onTrack: null, pacePerDay: 0, projected: 0 };
  }

  const pacePerDay = currentProgress / elapsedDays;
  const remaining = Math.max(0, goal - currentProgress);
  const daysRemaining = pacePerDay > 0 ? remaining / pacePerDay : Infinity;
  const projected = pacePerDay * totalDays;
  const onTrack = projected >= goal;

  return { daysRemaining, onTrack, pacePerDay, projected };
}

// Calendar helpers used by the estimator widget. All times in local zone.
export const periodTotalDays = (period) => {
  if (period === 'day') return 1;
  if (period === 'week') return 7;
  if (period === 'month') {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }
  if (period === 'year') {
    const year = new Date().getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 366 : 365;
  }
  return 1;
};

export const periodElapsedDays = (period) => {
  const now = new Date();
  if (period === 'day') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(1 / 1440, (now - startOfDay) / 86400000);
  }
  if (period === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    return Math.max(1 / 1440, (now - startOfWeek) / 86400000);
  }
  if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return Math.max(1 / 1440, (now - startOfMonth) / 86400000);
  }
  if (period === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.max(1 / 1440, (now - startOfYear) / 86400000);
  }
  return 1;
};
