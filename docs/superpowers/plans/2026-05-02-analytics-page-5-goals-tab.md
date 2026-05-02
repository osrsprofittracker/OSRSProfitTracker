# Analytics Page — Plan 5: Goals Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the Goals tab on `/analytics` with six widgets: goal hit-rate over time, streak counter (current + longest), milestone history table, profit-vs-goal overlay chart, time-to-goal estimator, and avg-vs-goal KPIs.

**Architecture:** Reads from existing `useMilestones` hook (`milestoneHistory` table) for past period results, and from the bucket data on `useAnalytics` for current-window pace. All goal logic uses the four period types already in the system: day, week, month, year. The estimator compares current-period pace to the active goal.

**Tech Stack:** React 18, recharts.

**Reference spec:** `docs/superpowers/specs/2026-05-02-analytics-page-design.md` § Goals tab

**Prerequisite:** Plan 1 must be merged.

---

## File Structure

**Created:**
- `src/components/analytics/widgets/GoalHitRateChart.jsx`
- `src/components/analytics/widgets/StreakCounter.jsx`
- `src/components/analytics/widgets/MilestoneHistoryTable.jsx`
- `src/components/analytics/widgets/ProfitVsGoalChart.jsx`
- `src/components/analytics/widgets/TimeToGoalEstimator.jsx`
- `src/components/analytics/widgets/AvgVsGoalKpis.jsx`
- `src/utils/goalAnalytics.js`
- `src/utils/goalAnalytics.test.js`

**Modified:**
- `src/components/analytics/GoalsTab.jsx` — replace placeholder

---

## Phase A: Goal aggregation helpers

### Task A1: `goalAnalytics.js`

**Files:**
- Create: `src/utils/goalAnalytics.js`
- Test: `src/utils/goalAnalytics.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/utils/goalAnalytics.test.js
import { describe, it, expect } from 'vitest';
import {
  computeHitRateSeries,
  computeStreaks,
  computeAvgVsGoal,
  estimateTimeToGoal,
} from './goalAnalytics';

const h = (period, period_start, actual, goal) => ({
  period, period_start, goal_amount: goal, actual_amount: actual,
});

describe('computeHitRateSeries', () => {
  it('returns rolling hit rate per period', () => {
    const history = [
      h('day', '2026-04-01', 10, 5),
      h('day', '2026-04-02', 3,  5),
      h('day', '2026-04-03', 8,  5),
      h('day', '2026-04-04', 4,  5),
    ];
    const out = computeHitRateSeries(history, 'day', 2);
    expect(out).toHaveLength(4);
    // window=2, so each point is hit/(hit+miss) over the last 2 entries
    expect(out[1].rate).toBeCloseTo(0.5);
    expect(out[3].rate).toBeCloseTo(0.5);
  });
});

describe('computeStreaks', () => {
  it('returns current and longest streak of hits in chronological order', () => {
    const history = [
      h('day', '2026-04-01', 10, 5),  // hit
      h('day', '2026-04-02', 12, 5),  // hit
      h('day', '2026-04-03', 1,  5),  // miss
      h('day', '2026-04-04', 6,  5),  // hit
      h('day', '2026-04-05', 7,  5),  // hit
      h('day', '2026-04-06', 8,  5),  // hit (most recent)
    ];
    const out = computeStreaks(history, 'day');
    expect(out.current).toBe(3);
    expect(out.longest).toBe(3);
  });

  it('current is 0 when last period was a miss', () => {
    const out = computeStreaks([
      h('day', '2026-04-01', 10, 5),
      h('day', '2026-04-02',  1, 5),
    ], 'day');
    expect(out.current).toBe(0);
    expect(out.longest).toBe(1);
  });
});

describe('computeAvgVsGoal', () => {
  it('returns avg actual vs goal', () => {
    const out = computeAvgVsGoal([
      h('day', '2026-04-01', 10, 5),
      h('day', '2026-04-02', 4,  5),
    ], 'day');
    expect(out.avg).toBe(7);
    expect(out.goal).toBe(5);
    expect(out.deltaPct).toBeCloseTo(40);
  });
});

describe('estimateTimeToGoal', () => {
  it('returns periods remaining at current pace', () => {
    const out = estimateTimeToGoal({ currentProgress: 30, goal: 100, periodsElapsed: 3, periodLengthDays: 1 });
    // pace = 10/period, remaining 70 → 7 days remaining
    expect(out.periodsRemaining).toBe(7);
    expect(out.daysRemaining).toBe(7);
    expect(out.onTrack).toBe(true);
  });
  it('marks off-track when pace too slow', () => {
    const out = estimateTimeToGoal({ currentProgress: 5, goal: 100, periodsElapsed: 5, periodLengthDays: 1, periodsTotal: 30 });
    expect(out.onTrack).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm test -- goalAnalytics`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement**

```js
// src/utils/goalAnalytics.js
const isHit = (h) => (h.actual_amount || 0) >= (h.goal_amount || 0) && (h.goal_amount || 0) > 0;

export function computeHitRateSeries(history, period, windowSize = 5) {
  const filtered = history
    .filter(h => h.period === period)
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
  const out = [];
  for (let i = 0; i < filtered.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = filtered.slice(start, i + 1);
    const hits = slice.filter(isHit).length;
    out.push({ date: filtered[i].period_start, rate: slice.length > 0 ? hits / slice.length : 0 });
  }
  return out;
}

export function computeStreaks(history, period) {
  const filtered = history
    .filter(h => h.period === period)
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
  let longest = 0;
  let run = 0;
  let current = 0;
  for (const h of filtered) {
    if (isHit(h)) { run += 1; longest = Math.max(longest, run); }
    else run = 0;
  }
  // current streak = trailing consecutive hits at the tail
  for (let i = filtered.length - 1; i >= 0; i--) {
    if (isHit(filtered[i])) current += 1;
    else break;
  }
  return { current, longest };
}

export function computeAvgVsGoal(history, period) {
  const filtered = history.filter(h => h.period === period);
  if (filtered.length === 0) return { avg: 0, goal: 0, deltaPct: null };
  const avg = filtered.reduce((s, h) => s + (h.actual_amount || 0), 0) / filtered.length;
  const goal = filtered.reduce((s, h) => s + (h.goal_amount || 0), 0) / filtered.length;
  const deltaPct = goal > 0 ? ((avg - goal) / goal) * 100 : null;
  return { avg, goal, deltaPct };
}

export function estimateTimeToGoal({ currentProgress, goal, periodsElapsed, periodLengthDays = 1, periodsTotal = null }) {
  if (goal <= 0 || periodsElapsed <= 0) return { periodsRemaining: null, daysRemaining: null, onTrack: null, pace: 0 };
  const pace = currentProgress / periodsElapsed;
  const remaining = Math.max(0, goal - currentProgress);
  const periodsRemaining = pace > 0 ? Math.ceil(remaining / pace) : Infinity;
  const daysRemaining = Number.isFinite(periodsRemaining) ? periodsRemaining * periodLengthDays : Infinity;
  const onTrack = periodsTotal == null
    ? remaining === 0 || (periodsRemaining <= (periodsTotal ?? Infinity))
    : (periodsElapsed + periodsRemaining) <= periodsTotal;
  return { periodsRemaining, daysRemaining, onTrack, pace };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- goalAnalytics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/goalAnalytics.js src/utils/goalAnalytics.test.js
git commit -m "feat(analytics): add goal aggregation helpers"
```

---

## Phase B: Widgets

### Task B1: `GoalHitRateChart`

**Files:**
- Create: `src/components/analytics/widgets/GoalHitRateChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/GoalHitRateChart.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { computeHitRateSeries } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'day',   label: 'Daily' },
  { key: 'week',  label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year',  label: 'Yearly' },
];

export default function GoalHitRateChart({ milestoneHistory }) {
  const [period, setPeriod] = useState('day');
  const data = computeHitRateSeries(milestoneHistory, period, 7).map(p => ({
    date: p.date,
    rate: Math.round(p.rate * 100),
  }));
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Goal hit rate</h3>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              type="button"
              className={`analytics-toggle${period === p.key ? ' is-on' : ''}`}
              onClick={() => setPeriod(p.key)}
            >{p.label}</button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="analytics-widget-empty">No completed {period} periods yet.</div>
      ) : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} stroke="rgb(148, 163, 184)" fontSize={11} />
              <ReferenceLine y={50} stroke="rgb(71, 85, 105)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
                formatter={v => [`${v}%`, 'Hit rate (rolling 7)']}
              />
              <Line type="monotone" dataKey="rate" stroke="rgb(168, 85, 247)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/GoalHitRateChart.jsx
git commit -m "feat(analytics): add GoalHitRateChart widget"
```

---

### Task B2: `StreakCounter`

**Files:**
- Create: `src/components/analytics/widgets/StreakCounter.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/StreakCounter.jsx
import React from 'react';
import { computeStreaks } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'day',   label: 'Daily',   icon: '☀️' },
  { key: 'week',  label: 'Weekly',  icon: '📅' },
  { key: 'month', label: 'Monthly', icon: '📊' },
];

export default function StreakCounter({ milestoneHistory }) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Streaks</h3>
      </div>
      <div className="analytics-kpi-strip">
        {PERIODS.map(p => {
          const { current, longest } = computeStreaks(milestoneHistory, p.key);
          return (
            <div key={p.key} className="analytics-kpi-mini">
              <div className="analytics-kpi-mini-label">{p.icon} {p.label}</div>
              <div className="analytics-kpi-mini-value">{current}</div>
              <div className="analytics-kpi-mini-delta" style={{ color: 'rgb(148, 163, 184)' }}>
                Longest: {longest}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/StreakCounter.jsx
git commit -m "feat(analytics): add StreakCounter widget"
```

---

### Task B3: `MilestoneHistoryTable`

**Files:**
- Create: `src/components/analytics/widgets/MilestoneHistoryTable.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/MilestoneHistoryTable.jsx
import React, { useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';

const PERIODS = ['all', 'day', 'week', 'month', 'year'];

export default function MilestoneHistoryTable({ milestoneHistory, numberFormat }) {
  const [period, setPeriod] = useState('all');

  const rows = useMemo(() => {
    const filtered = period === 'all'
      ? milestoneHistory
      : milestoneHistory.filter(h => h.period === period);
    return [...filtered].sort((a, b) => b.period_start.localeCompare(a.period_start));
  }, [milestoneHistory, period]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Milestone history</h3>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              className={`analytics-toggle${period === p ? ' is-on' : ''}`}
              onClick={() => setPeriod(p)}
            >{p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="items-table-wrap" style={{ maxHeight: '24rem' }}>
        <table className="items-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Start</th>
              <th>Goal</th>
              <th>Actual</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const hit = (r.actual_amount || 0) >= (r.goal_amount || 0) && (r.goal_amount || 0) > 0;
              return (
                <tr key={`${r.period}-${r.period_start}`}>
                  <td>{r.period}</td>
                  <td>{r.period_start}</td>
                  <td>{formatNumber(r.goal_amount, numberFormat)}</td>
                  <td>{formatNumber(r.actual_amount, numberFormat)}</td>
                  <td style={{ color: hit ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)', fontWeight: 600 }}>
                    {hit ? 'Hit' : 'Miss'}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgb(148, 163, 184)', padding: '1.5rem' }}>No milestone history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/MilestoneHistoryTable.jsx
git commit -m "feat(analytics): add MilestoneHistoryTable widget"
```

---

### Task B4: `ProfitVsGoalChart`

**Files:**
- Create: `src/components/analytics/widgets/ProfitVsGoalChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ProfitVsGoalChart.jsx
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const PERIODS = [
  { key: 'day',   label: 'Daily' },
  { key: 'week',  label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
];

export default function ProfitVsGoalChart({ milestoneHistory, milestones, numberFormat }) {
  const [period, setPeriod] = useState('day');

  const data = useMemo(() => {
    const goal = milestones?.[period]?.goal || 0;
    return milestoneHistory
      .filter(h => h.period === period)
      .sort((a, b) => a.period_start.localeCompare(b.period_start))
      .map(h => ({ date: h.period_start, profit: h.actual_amount || 0, goal }));
  }, [milestoneHistory, period, milestones]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Profit vs goal</h3>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              type="button"
              className={`analytics-toggle${period === p.key ? ' is-on' : ''}`}
              onClick={() => setPeriod(p.key)}
            >{p.label}</button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="analytics-widget-empty">No completed {period} periods yet.</div>
      ) : (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
              <YAxis stroke="rgb(148, 163, 184)" fontSize={11}
                tickFormatter={v => formatNumber(v, numberFormat)} />
              <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
              <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
                formatter={v => formatNumber(v, numberFormat)} />
              <Legend wrapperStyle={{ color: 'rgb(148, 163, 184)', fontSize: 11 }} />
              <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" strokeWidth={2} dot={false} name="Profit" />
              <Line type="monotone" dataKey="goal"   stroke="rgb(168, 85, 247)" strokeDasharray="4 4" dot={false} name="Goal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ProfitVsGoalChart.jsx
git commit -m "feat(analytics): add ProfitVsGoalChart widget"
```

---

### Task B5: `TimeToGoalEstimator`

**Files:**
- Create: `src/components/analytics/widgets/TimeToGoalEstimator.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/TimeToGoalEstimator.jsx
import React from 'react';
import { estimateTimeToGoal } from '../../../utils/goalAnalytics';
import { formatNumber } from '../../../utils/formatters';

const periodLengthDays = (period) => period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

const periodTotalDays = (period) => period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;

const periodElapsedDays = (period) => {
  const now = new Date();
  if (period === 'day') {
    const ms = now - new Date(now.toISOString().slice(0, 10));
    return Math.max(0.01, ms / 86400000);
  }
  if (period === 'week') {
    const day = (now.getDay() + 6) % 7; // Mon=0
    return day + (now.getHours() / 24);
  }
  if (period === 'month') return now.getDate();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
};

const PERIODS = [
  { key: 'month', label: 'Monthly' },
  { key: 'year',  label: 'Yearly' },
];

function Card({ period, label, currentProgress, goal, numberFormat }) {
  if (!goal) {
    return (
      <div className="analytics-kpi-mini">
        <div className="analytics-kpi-mini-label">{label} goal</div>
        <div className="analytics-kpi-mini-value">—</div>
        <div className="analytics-kpi-mini-delta" style={{ color: 'rgb(148, 163, 184)' }}>No goal set</div>
      </div>
    );
  }
  const periodsTotal   = periodTotalDays(period);
  const elapsed        = periodElapsedDays(period);
  const result = estimateTimeToGoal({
    currentProgress,
    goal,
    periodsElapsed: elapsed,
    periodLengthDays: periodLengthDays(period) / periodTotalDays(period),
    periodsTotal,
  });
  const remainingLabel = !Number.isFinite(result.daysRemaining) ? '∞ days'
    : `${Math.ceil(result.daysRemaining)} day${Math.ceil(result.daysRemaining) === 1 ? '' : 's'}`;
  const color = result.onTrack ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  return (
    <div className="analytics-kpi-mini">
      <div className="analytics-kpi-mini-label">{label} goal</div>
      <div className="analytics-kpi-mini-value">{remainingLabel}</div>
      <div className="analytics-kpi-mini-delta" style={{ color }}>
        {result.onTrack ? 'On track' : 'Behind pace'} · {formatNumber(currentProgress, numberFormat)} / {formatNumber(goal, numberFormat)}
      </div>
    </div>
  );
}

export default function TimeToGoalEstimator({ milestones, milestoneProgress, numberFormat }) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Time to goal</h3>
        <p className="analytics-widget-subtitle" style={{ margin: 0 }}>At current pace</p>
      </div>
      <div className="analytics-kpi-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {PERIODS.map(p => (
          <Card
            key={p.key}
            period={p.key}
            label={p.label}
            currentProgress={milestoneProgress?.[p.key] || 0}
            goal={milestones?.[p.key]?.goal || 0}
            numberFormat={numberFormat}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/TimeToGoalEstimator.jsx
git commit -m "feat(analytics): add TimeToGoalEstimator widget"
```

---

### Task B6: `AvgVsGoalKpis`

**Files:**
- Create: `src/components/analytics/widgets/AvgVsGoalKpis.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/AvgVsGoalKpis.jsx
import React from 'react';
import { computeAvgVsGoal } from '../../../utils/goalAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PERIODS = [
  { key: 'day',   label: 'Daily' },
  { key: 'week',  label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
];

function Card({ period, label, milestoneHistory, numberFormat }) {
  const { avg, goal, deltaPct } = computeAvgVsGoal(milestoneHistory, period);
  const color = deltaPct == null ? 'rgb(148, 163, 184)' : deltaPct >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  return (
    <div className="analytics-kpi-mini">
      <div className="analytics-kpi-mini-label">{label} avg vs goal</div>
      <div className="analytics-kpi-mini-value">{formatNumber(Math.round(avg), numberFormat)}</div>
      <div className="analytics-kpi-mini-delta" style={{ color }}>
        {deltaPct == null ? `Goal: ${formatNumber(Math.round(goal), numberFormat)}` :
          `${deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(deltaPct).toFixed(1)}% vs ${formatNumber(Math.round(goal), numberFormat)}`}
      </div>
    </div>
  );
}

export default function AvgVsGoalKpis({ milestoneHistory, numberFormat }) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Avg vs goal</h3>
      </div>
      <div className="analytics-kpi-strip">
        {PERIODS.map(p => <Card key={p.key} period={p.key} label={p.label} milestoneHistory={milestoneHistory} numberFormat={numberFormat} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/AvgVsGoalKpis.jsx
git commit -m "feat(analytics): add AvgVsGoalKpis widget"
```

---

## Phase C: Wire widgets into `GoalsTab`

### Task C1: Replace placeholder

**Files:**
- Modify: `src/components/analytics/GoalsTab.jsx`
- Modify: `src/pages/AnalyticsPage.jsx`

- [ ] **Step 1: Implement `GoalsTab`**

```jsx
// src/components/analytics/GoalsTab.jsx
import React from 'react';
import GoalHitRateChart from './widgets/GoalHitRateChart';
import StreakCounter from './widgets/StreakCounter';
import MilestoneHistoryTable from './widgets/MilestoneHistoryTable';
import ProfitVsGoalChart from './widgets/ProfitVsGoalChart';
import TimeToGoalEstimator from './widgets/TimeToGoalEstimator';
import AvgVsGoalKpis from './widgets/AvgVsGoalKpis';

export default function GoalsTab({ milestones, milestoneHistory, milestoneProgress, numberFormat }) {
  return (
    <div className="analytics-stack">
      <div className="analytics-grid-2">
        <StreakCounter milestoneHistory={milestoneHistory} />
        <AvgVsGoalKpis milestoneHistory={milestoneHistory} numberFormat={numberFormat} />
      </div>
      <GoalHitRateChart milestoneHistory={milestoneHistory} />
      <ProfitVsGoalChart milestoneHistory={milestoneHistory} milestones={milestones} numberFormat={numberFormat} />
      <TimeToGoalEstimator milestones={milestones} milestoneProgress={milestoneProgress} numberFormat={numberFormat} />
      <MilestoneHistoryTable milestoneHistory={milestoneHistory} numberFormat={numberFormat} />
    </div>
  );
}
```

- [ ] **Step 2: Pass props from `AnalyticsPage`**

In `src/pages/AnalyticsPage.jsx`:

1. Import the values from MainApp via the existing prop chain. Add to the page signature: `milestones, milestoneHistory, milestoneProgress`.
2. Replace the existing `<GoalsTab>` line:

```jsx
{mountedTabs.has('goals') && (
  <div hidden={activeTab !== 'goals'}>
    <GoalsTab
      milestones={milestones}
      milestoneHistory={milestoneHistory}
      milestoneProgress={milestoneProgress}
      numberFormat={numberFormat}
    />
  </div>
)}
```

3. In `src/MainApp.jsx`, find the `<AnalyticsPage>` render and add:

```jsx
<AnalyticsPage
  /* existing props */
  milestones={milestones}
  milestoneHistory={milestoneHistory}
  milestoneProgress={milestoneProgress}
/>
```

`milestones`, `milestoneHistory`, and `milestoneProgress` are already available in `MainApp.jsx` from the existing `useMilestones` hook usage.

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, click Goals tab. Expect:
- Streak counter shows current and longest streak per period type.
- Avg vs goal KPIs populated.
- Hit-rate line chart animates between Daily/Weekly/Monthly/Yearly.
- Profit vs goal overlay chart animates between Daily/Weekly/Monthly.
- Time-to-goal cards show "On track" or "Behind pace" with day count.
- Milestone history table sortable by period filter.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/GoalsTab.jsx src/pages/AnalyticsPage.jsx src/MainApp.jsx
git commit -m "feat(analytics): wire all goals-tab widgets"
```

---

## Manual verification checklist

- [ ] Streak counters reflect what the milestone history shows
- [ ] Hit-rate chart renders with rolling-window smoothing
- [ ] Profit vs goal chart shows both lines, dashed goal
- [ ] Time-to-goal cards show "Behind pace" / "On track" correctly
- [ ] Milestone history table filters by period
- [ ] Avg vs goal KPIs delta is correct (verified manually against sum of profits)
- [ ] No console errors

---

## Self-review notes

Spec coverage check (Goals tab):

- Widget 1 Goal hit-rate over time — ✅ Task B1
- Widget 2 Streak counter — ✅ Task B2
- Widget 3 Milestone history table — ✅ Task B3
- Widget 4 Profit vs goal chart — ✅ Task B4
- Widget 6 Time-to-goal estimator — ✅ Task B5
- Widget 7 Avg vs goal KPIs — ✅ Task B6

(Widget 5 calendar grid and Widget 8 best/worst periods were excluded during brainstorming.)

Edge cases:
- All widgets degrade to friendly empty states when there's no milestone history.
- `TimeToGoalEstimator` shows "No goal set" when the user hasn't configured a goal for that period.
- Streaks count from the chronological tail; missed periods reset the current streak.
