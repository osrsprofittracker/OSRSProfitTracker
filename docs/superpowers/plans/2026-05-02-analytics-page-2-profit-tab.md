# Analytics Page — Plan 2: Profit Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the Profit tab on `/analytics` with eight widgets: profit-over-time line, cumulative profit area, profit-by-source stacked bar, GP-traded bar, period-comparison cards, best-periods table, KPI strip (avg profit/sell, avg margin %, win rate), and a profit heatmap.

**Architecture:** All widgets read from the `buckets` array returned by `useAnalytics` (already wired in Plan 1) and from existing in-context data (`transactions`, `stocks`, `profitHistory`) for per-day breakdowns the bucketed RPC doesn't return. Realized per-transaction profit must be joined from `profitHistory` rows by `transaction_id`; do not calculate item profit from `transactions.cost_basis`, because the current app does not write that column. Charts use `recharts`. The heatmap is a custom SVG grid.

**Tech Stack:** React 18, recharts, lucide-react.

**Reference spec:** `docs/superpowers/specs/2026-05-02-analytics-page-design.md` § Profit tab

**Prerequisite:** Plan 1 must be merged (the page shell, hooks, and RPC are required).

---

## Plan-wide corrections from foundation review

- Use the Plan 1 bucket contract: `profit_items`, `profit_dump`, `profit_referral`, `profit_bonds`, `gp_traded`, `by_category`, `sells_count`, and `wins_count`.
- Do not use `transactions.cost_basis`. For any per-transaction profit, build a map from `profitHistory.filter(p => p.profit_type === 'stock')` keyed by `transaction_id`.
- The existing app maps transaction rows to camelCase (`stockId`, `stockName`, `profitHistoryId`), so widget code should read `tx.stockId` first and only fall back to `tx.stock_id` for test fixtures.
- Do not add inline CSS while implementing this plan. Move any `style={{...}}` shown in older snippets into `src/styles/analytics-widgets.css` or a widget-specific stylesheet before committing.

## Post-implementation corrections from Profit tab bug review

This section supersedes any older snippets below that conflict with it.

- Do not add automated tests, test files, test runners, or test dependencies unless the user explicitly asks for them. If older steps say to use Vitest, skip those steps and use `npm run build` plus the manual browser checklist instead.
- Total profit labeled as app-wide "Total Profit" must match the Trade/Home calculation: `stocks.totalCostSold - stocks.totalCostBasisSold + dump/referral/bonds`. Bucketed `profit_history` analytics are period analytics and must be labeled as such.
- When `timeframe=all`, Period Profit must either use the same all-time total source as Trade/Home or clearly say it is bucketed analytics profit. Do not show two different values with the same meaning.
- `useTransactions.fetchTransactions()` must load every transaction with Supabase pagination (`range()` batches), not `.limit(1000)`. Analytics that depend on transactions must wait for complete transaction data before caching or rendering totals.
- Do not trust RPC `gp_traded` for sell turnover unless the SQL has been manually updated and backfilled. The known bug was older sells missing from `profit_history.transaction_id`; merge or override GP-traded buckets from complete local transaction totals.
- Cumulative profit must be built from daily all-time buckets, then filtered to the selected window. Do not compute cumulative lines from week/month buckets, because bucket start dates change the value shown for the same calendar date.
- Default cumulative mode should keep the all-time baseline so the same date has the same cumulative value across timeframes. If a local "Window baseline" toggle exists, label it that way and explain that it resets the selected window to zero.
- User-facing copy should avoid raw "bucket" wording unless immediately explained as "grouping interval: day, week, or month".
- The best-periods widget replaces the earlier best/worst-days widget. Show best periods only, add a local timeframe selector independent of the page timeframe, and add grouping controls for day/week/month/year.
- Best-period "Top item" must be calculated independently from the best source. Rank item profit entries inside the winning period; if profit linkage is missing, fall back to highest sell GP volume. Show `-` only when the period has no item profit and no item sell transactions.
- Add custom hover tooltips for every section header, KPI, chart control, modal button, and ambiguous label. Do not put both `title` and custom tooltip attributes on the same element, because that creates duplicate browser and custom tooltips.
- Profit KPI tooltips must state their comparison basis: selected global timeframe versus the immediately previous same-length timeframe.
- Profit by source must draw a clear zero reference line. Its Y-axis domain must come from actual stacked positive/negative totals: if all values are non-negative, zero sits at the bottom; only allocate negative space when visible data goes below zero.
- Heatmap tooltip/copy must say lighter/brighter green means more profit. Do not say darker green if the palette uses lighter cells for stronger profit.
- Compact number formatting must preserve signs and use absolute thresholds, e.g. `-2.50 M` rather than falling through to a raw negative.
- Final verification must include manual visual checks at desktop and mobile widths. If the browser plugin is unavailable, record that blocker and still run `npm run build`.

## File Structure

**Created:**
- `src/components/analytics/widgets/ProfitOverTimeChart.jsx`
- `src/components/analytics/widgets/CumulativeProfitChart.jsx`
- `src/components/analytics/widgets/ProfitBySourceChart.jsx`
- `src/components/analytics/widgets/GpTradedChart.jsx`
- `src/components/analytics/widgets/PeriodComparisonCards.jsx`
- `src/components/analytics/widgets/BestDaysTable.jsx`
- `src/components/analytics/widgets/ProfitKpiStrip.jsx`
- `src/components/analytics/widgets/ProfitHeatmap.jsx`
- `src/styles/analytics-widgets.css`
- `src/hooks/useAnalytics.js` - modified to merge complete transaction-derived GP-traded buckets and avoid stale cache keys
- `src/hooks/useTransactions.js` - modified to load all transactions with pagination
- `src/utils/formatters.js` - modified to preserve sign in compact formatting

**Modified:**
- `src/components/analytics/ProfitTab.jsx` — replace placeholder with the real layout

---

## Phase A: Shared widget styling

### Task A1: Widget stylesheet

**Files:**
- Create: `src/styles/analytics-widgets.css`

- [ ] **Step 1: Create the stylesheet**

```css
/* src/styles/analytics-widgets.css */
.analytics-widget {
  background: rgb(22, 30, 46);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 0.875rem;
  padding: 1rem 1.25rem;
}

.analytics-widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
  gap: 0.5rem;
}

.analytics-widget-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.analytics-widget-subtitle {
  font-size: 0.75rem;
  color: rgb(148, 163, 184);
  margin: 0;
}

.analytics-widget-body {
  min-height: 12rem;
}

.analytics-widget-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  color: rgb(148, 163, 184);
  text-align: center;
}

.analytics-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.analytics-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.analytics-toggle {
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.5);
  color: rgb(203, 213, 225);
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.analytics-toggle.is-on {
  background: rgb(168, 85, 247);
  color: white;
  border-color: rgb(168, 85, 247);
}

.analytics-kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
}

.analytics-kpi-mini {
  background: rgb(15, 23, 42);
  border-radius: 0.625rem;
  padding: 0.625rem 0.75rem;
}

.analytics-kpi-mini-label {
  font-size: 0.6875rem;
  color: rgb(148, 163, 184);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.analytics-kpi-mini-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin-top: 0.25rem;
}

.analytics-kpi-mini-delta {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.125rem;
}

.analytics-bw-table {
  width: 100%;
  font-size: 0.8125rem;
  color: white;
}

.analytics-bw-table th,
.analytics-bw-table td {
  padding: 0.375rem 0.5rem;
  text-align: left;
}

.analytics-bw-table thead {
  color: rgb(148, 163, 184);
  font-weight: 600;
  border-bottom: 1px solid rgb(51, 65, 85);
}

.analytics-heatmap {
  display: grid;
  grid-template-columns: repeat(53, 1fr);
  gap: 2px;
}

.analytics-heatmap-cell {
  aspect-ratio: 1 / 1;
  border-radius: 2px;
  background: rgb(30, 41, 59);
  cursor: pointer;
}

@media (max-width: 1023px) {
  .analytics-grid-2 { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Import the stylesheet in `ProfitTab.jsx` (and later other tabs)**

For now leave the import for the next task.

- [ ] **Step 3: Commit**

```bash
git add src/styles/analytics-widgets.css
git commit -m "feat(analytics): add shared widget styles"
```

---

## Phase B: Widgets

### Task B1: `ProfitOverTimeChart`

**Files:**
- Create: `src/components/analytics/widgets/ProfitOverTimeChart.jsx`

- [ ] **Step 1: Implement the widget**

```jsx
// src/components/analytics/widgets/ProfitOverTimeChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const totalProfit = (b) => b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds;

export default function ProfitOverTimeChart({ buckets, numberFormat }) {
  if (!buckets?.length) {
    return (
      <div className="analytics-widget">
        <div className="analytics-widget-header">
          <h3 className="analytics-widget-title">Profit over time</h3>
        </div>
        <div className="analytics-widget-empty">No activity in this window. Try a wider timeframe.</div>
      </div>
    );
  }

  const data = buckets.map(b => ({
    date: b.bucket_date,
    profit: totalProfit(b),
    sells: b.sells_count,
    wins: b.wins_count,
  }));

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Profit over time</h3>
      </div>
      <div className="analytics-widget-body" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={(v) => formatNumber(v, numberFormat)} />
            <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)', borderRadius: 8 }}
              labelStyle={{ color: 'rgb(148, 163, 184)' }}
              formatter={(value, name, ctx) => {
                if (name === 'profit') return [formatNumber(value, numberFormat), 'Profit'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload;
                if (!row) return label;
                const winRate = row.sells > 0 ? Math.round((row.wins / row.sells) * 100) : 0;
                return `${label} · ${row.sells} sells · ${winRate}% wins`;
              }}
            />
            <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ProfitOverTimeChart.jsx
git commit -m "feat(analytics): add ProfitOverTimeChart widget"
```

---

### Task B2: `CumulativeProfitChart`

**Files:**
- Create: `src/components/analytics/widgets/CumulativeProfitChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CumulativeProfitChart.jsx
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const total = (b) => b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds;

export default function CumulativeProfitChart({ buckets, allTimeBaseline = 0, numberFormat }) {
  const [allTime, setAllTime] = useState(false);

  const data = useMemo(() => {
    let running = allTime ? allTimeBaseline : 0;
    return buckets.map(b => {
      running += total(b);
      return { date: b.bucket_date, cumulative: running };
    });
  }, [buckets, allTime, allTimeBaseline]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Cumulative profit</h3>
        <button
          type="button"
          className={`analytics-toggle${allTime ? ' is-on' : ''}`}
          onClick={() => setAllTime(v => !v)}
        >
          Window baseline
        </button>
      </div>
      <div className="analytics-widget-body" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cumGradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="rgb(34, 197, 94)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={(v) => formatNumber(v, numberFormat)} />
            <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)', borderRadius: 8 }}
              formatter={(v) => [formatNumber(v, numberFormat), 'Cumulative']}
            />
            <Area type="monotone" dataKey="cumulative" stroke="rgb(34, 197, 94)" fill="url(#cumGradPos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CumulativeProfitChart.jsx
git commit -m "feat(analytics): add CumulativeProfitChart widget"
```

---

### Task B3: `ProfitBySourceChart`

**Files:**
- Create: `src/components/analytics/widgets/ProfitBySourceChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ProfitBySourceChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const SOURCES = [
  { key: 'profit_items',    label: 'Items',    color: 'rgb(96, 165, 250)' },
  { key: 'profit_dump',     label: 'Dump',     color: 'rgb(52, 211, 153)' },
  { key: 'profit_referral', label: 'Referral', color: 'rgb(168, 85, 247)' },
  { key: 'profit_bonds',    label: 'Bonds',    color: 'rgb(234, 179, 8)' },
];

export default function ProfitBySourceChart({ buckets, numberFormat }) {
  const data = buckets.map(b => ({ date: b.bucket_date, ...b }));
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Profit by source</h3>
      </div>
      <div className="analytics-widget-body" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={(v) => formatNumber(v, numberFormat)} />
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)', borderRadius: 8 }}
              formatter={(v, name) => [formatNumber(v, numberFormat), name]}
            />
            <Legend wrapperStyle={{ color: 'rgb(148, 163, 184)', fontSize: 12 }} />
            {SOURCES.map(s => (
              <Bar key={s.key} dataKey={s.key} stackId="profit" fill={s.color} name={s.label} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ProfitBySourceChart.jsx
git commit -m "feat(analytics): add ProfitBySourceChart widget"
```

---

### Task B4: `GpTradedChart`

**Files:**
- Create: `src/components/analytics/widgets/GpTradedChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/GpTradedChart.jsx
import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

export default function GpTradedChart({ buckets, numberFormat }) {
  const [showTxCount, setShowTxCount] = useState(false);
  const data = buckets.map(b => ({ date: b.bucket_date, gp_traded: b.gp_traded, sells: b.sells_count }));

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">GP traded over time</h3>
        <button
          type="button"
          className={`analytics-toggle${showTxCount ? ' is-on' : ''}`}
          onClick={() => setShowTxCount(v => !v)}
        >
          Show sell count
        </button>
      </div>
      <div className="analytics-widget-body" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis yAxisId="left" stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={(v) => formatNumber(v, numberFormat)} />
            {showTxCount && <YAxis yAxisId="right" orientation="right" stroke="rgb(148, 163, 184)" fontSize={11} />}
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)', borderRadius: 8 }}
              formatter={(v, name) => name === 'GP traded' ? [formatNumber(v, numberFormat), name] : [v, name]}
            />
            <Bar yAxisId="left" dataKey="gp_traded" fill="rgb(96, 165, 250)" name="GP traded" />
            {showTxCount && <Line yAxisId="right" type="monotone" dataKey="sells" stroke="rgb(234, 179, 8)" name="Sells" dot={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/GpTradedChart.jsx
git commit -m "feat(analytics): add GpTradedChart widget"
```

---

### Task B5: `PeriodComparisonCards`

**Files:**
- Create: `src/components/analytics/widgets/PeriodComparisonCards.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/PeriodComparisonCards.jsx
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const total = (b) => b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds;
const sumProfit = (buckets) => buckets.reduce((s, b) => s + total(b), 0);

function Card({ label, current, prior, sparkline, numberFormat, hasData }) {
  if (!hasData) {
    return (
      <div className="analytics-widget" style={{ minHeight: '8rem' }}>
        <div className="analytics-widget-subtitle">{label}</div>
        <div style={{ color: 'rgb(148, 163, 184)', marginTop: '0.5rem' }}>Not enough history</div>
      </div>
    );
  }
  const pct = prior > 0 ? ((current - prior) / Math.abs(prior)) * 100 : null;
  const color = pct == null ? 'rgb(148, 163, 184)' : pct >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  return (
    <div className="analytics-widget" style={{ minHeight: '8rem' }}>
      <div className="analytics-widget-subtitle">{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
        {formatNumber(current, numberFormat)}
      </div>
      {pct != null && (
        <div style={{ color, fontSize: '0.8125rem', fontWeight: 600 }}>
          {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs prior
        </div>
      )}
      <div className="analytics-mini-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function PeriodComparisonCards({ thisPeriod, lastPeriod, samePeriodLastYear, periodLabel, numberFormat }) {
  return (
    <div className="analytics-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      <Card label={`This ${periodLabel}`}    current={sumProfit(thisPeriod)}         prior={sumProfit(lastPeriod)}         sparkline={thisPeriod.map(total)}         numberFormat={numberFormat} hasData={thisPeriod.length > 0} />
      <Card label={`Last ${periodLabel}`}    current={sumProfit(lastPeriod)}         prior={0}                              sparkline={lastPeriod.map(total)}         numberFormat={numberFormat} hasData={lastPeriod.length > 0} />
      <Card label={`Same ${periodLabel} last year`} current={sumProfit(samePeriodLastYear)} prior={0}                       sparkline={samePeriodLastYear.map(total)} numberFormat={numberFormat} hasData={samePeriodLastYear.length > 0} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/PeriodComparisonCards.jsx
git commit -m "feat(analytics): add PeriodComparisonCards widget"
```

---

### Task B6: `BestDaysTable`

**Files:**
- Create: `src/components/analytics/widgets/BestDaysTable.jsx`

**Important correction:** This task must render best periods only. If the older illustrative snippet below still contains `bottom` rows or a bottom table, delete that code during implementation and replace it with local controls for timeframe and grouping (`day`, `week`, `month`, `year`).

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/BestDaysTable.jsx
import React, { useMemo } from 'react';
import { formatNumber } from '../../../utils/formatters';

const total = (b) => b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds;

const topItemForBucket = (transactions, stockMap, profitByTx, bucketDate) => {
  const sums = new Map();
  for (const tx of transactions) {
    if (tx.type !== 'sell') continue;
    if (String(tx.date).slice(0, 10) !== bucketDate) continue;
    const profit = profitByTx.get(tx.id) || 0;
    const stock = stockMap.get(tx.stockId ?? tx.stock_id);
    const name = stock?.name || tx.stockName || 'Unknown';
    sums.set(name, (sums.get(name) || 0) + profit);
  }
  let best = null;
  for (const [name, p] of sums.entries()) {
    if (!best || p > best.profit) best = { name, profit: p };
  }
  return best?.name || '—';
};

export default function BestDaysTable({ buckets, transactions, stocks, profitHistory, numberFormat, onNavigateToHistory }) {
  const stockMap = useMemo(() => new Map(stocks.map(s => [s.id, s])), [stocks]);
  const profitByTx = useMemo(() => {
    const map = new Map();
    for (const p of profitHistory || []) {
      if (p.profit_type !== 'stock' || !p.transaction_id) continue;
      map.set(p.transaction_id, (map.get(p.transaction_id) || 0) + (Number(p.amount) || 0));
    }
    return map;
  }, [profitHistory]);
  const ranked = useMemo(() => {
    return [...buckets]
      .map(b => ({ date: b.bucket_date, profit: total(b), sells: b.sells_count }))
      .sort((a, b) => b.profit - a.profit);
  }, [buckets]);
  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-5).reverse();

  const Row = ({ row }) => (
    <tr style={{ cursor: onNavigateToHistory ? 'pointer' : 'default' }}
        onClick={() => onNavigateToHistory?.(row.date)}>
      <td>{row.date}</td>
      <td style={{ color: row.profit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
        {formatNumber(row.profit, numberFormat)}
      </td>
      <td>{row.sells}</td>
      <td>{topItemForBucket(transactions, stockMap, profitByTx, row.date)}</td>
    </tr>
  );

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Best / Worst days</h3>
      </div>
      <div className="analytics-widget-body">
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="analytics-widget-subtitle">Top 5 periods</div>
          <table className="analytics-bw-table">
            <thead><tr><th>Date</th><th>Profit</th><th>Sells</th><th>Top item</th></tr></thead>
            <tbody>{top.map(r => <Row key={r.date} row={r} />)}</tbody>
          </table>
        </div>
        <div>
          <div className="analytics-widget-subtitle">Do not render worst periods</div>
          <table className="analytics-bw-table">
            <thead><tr><th>Date</th><th>Profit</th><th>Sells</th><th>Top item</th></tr></thead>
            <tbody>{bottom.map(r => <Row key={r.date} row={r} />)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/BestDaysTable.jsx
git commit -m "feat(analytics): add BestDaysTable widget"
```

---

### Task B7: `ProfitKpiStrip`

**Files:**
- Create: `src/components/analytics/widgets/ProfitKpiStrip.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ProfitKpiStrip.jsx
import React from 'react';
import { formatNumber } from '../../../utils/formatters';

const sumSells = (buckets) => buckets.reduce((s, b) => s + b.sells_count, 0);
const sumWins  = (buckets) => buckets.reduce((s, b) => s + b.wins_count, 0);
const sumProfitItems = (buckets) => buckets.reduce((s, b) => s + b.profit_items, 0);
const sumGp    = (buckets) => buckets.reduce((s, b) => s + b.gp_traded, 0);

const fmtPct = (v) => isFinite(v) ? `${v.toFixed(1)}%` : '—';

function Mini({ label, value, delta, valueClass }) {
  const color = delta == null ? 'rgb(148, 163, 184)' : delta >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  return (
    <div className="analytics-kpi-mini">
      <div className="analytics-kpi-mini-label">{label}</div>
      <div className={`analytics-kpi-mini-value ${valueClass || ''}`}>{value}</div>
      {delta != null && (
        <div className="analytics-kpi-mini-delta" style={{ color }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

const pctDelta = (cur, prev) => prev > 0 ? ((cur - prev) / Math.abs(prev)) * 100 : null;

export default function ProfitKpiStrip({ currentBuckets, priorBuckets, numberFormat }) {
  const sells = sumSells(currentBuckets);
  const wins  = sumWins(currentBuckets);
  const itemsProfit = sumProfitItems(currentBuckets);
  const gp    = sumGp(currentBuckets);

  const priorSells = sumSells(priorBuckets);
  const priorWins  = sumWins(priorBuckets);
  const priorItemsProfit = sumProfitItems(priorBuckets);
  const priorGp    = sumGp(priorBuckets);

  const avgPerSell      = sells > 0 ? itemsProfit / sells : 0;
  const priorAvgPerSell = priorSells > 0 ? priorItemsProfit / priorSells : 0;

  const avgMargin      = gp > 0 ? (itemsProfit / gp) * 100 : 0;
  const priorAvgMargin = priorGp > 0 ? (priorItemsProfit / priorGp) * 100 : 0;

  const winRate      = sells > 0 ? (wins / sells) * 100 : 0;
  const priorWinRate = priorSells > 0 ? (priorWins / priorSells) * 100 : 0;

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Profit KPIs</h3>
      </div>
      <div className="analytics-kpi-strip">
        <Mini label="Avg / sell" value={formatNumber(Math.round(avgPerSell), numberFormat)} delta={pctDelta(avgPerSell, priorAvgPerSell)} />
        <Mini label="Avg margin" value={fmtPct(avgMargin)} delta={pctDelta(avgMargin, priorAvgMargin)} />
        <Mini label="Win rate"   value={fmtPct(winRate)}  delta={pctDelta(winRate,  priorWinRate)} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ProfitKpiStrip.jsx
git commit -m "feat(analytics): add ProfitKpiStrip widget"
```

---

### Task B8: `ProfitHeatmap`

**Files:**
- Create: `src/components/analytics/widgets/ProfitHeatmap.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ProfitHeatmap.jsx
import React, { useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';

const total = (b) => b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds;

const colorFor = (profit, posSteps, negSteps) => {
  if (profit === 0) return 'rgb(30, 41, 59)';
  if (profit > 0) {
    const idx = posSteps.findIndex(t => profit <= t);
    const i = idx === -1 ? posSteps.length - 1 : idx;
    const shades = ['#1f3b2c', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
    return shades[Math.min(i, shades.length - 1)];
  }
  const idx = negSteps.findIndex(t => Math.abs(profit) <= Math.abs(t));
  const i = idx === -1 ? negSteps.length - 1 : idx;
  const shades = ['#3b1f24', '#7f1d1d', '#b91c1c', '#dc2626', '#f87171'];
  return shades[Math.min(i, shades.length - 1)];
};

const buildLast365Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

const quantiles = (values, count) => {
  const sorted = [...values].filter(v => v > 0).sort((a, b) => a - b);
  if (!sorted.length) return [];
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * i / count) - 1)]);
  }
  return out;
};

export default function ProfitHeatmap({ allBuckets, numberFormat, onCellClick }) {
  const [hovered, setHovered] = useState(null);
  const days = useMemo(buildLast365Days, []);
  const profitByDate = useMemo(() => {
    const map = new Map();
    for (const b of allBuckets) map.set(b.bucket_date, total(b));
    return map;
  }, [allBuckets]);
  const values = useMemo(() => days.map(d => profitByDate.get(d) || 0), [days, profitByDate]);
  const posSteps = useMemo(() => quantiles(values, 5), [values]);
  const negSteps = useMemo(() => quantiles(values.filter(v => v < 0).map(v => -v), 5).map(v => -v), [values]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Profit heatmap (last 365 days)</h3>
        {hovered && (
          <span className="analytics-widget-subtitle">
            {hovered.date}: {formatNumber(hovered.profit, numberFormat)}
          </span>
        )}
      </div>
      <div className="analytics-heatmap">
        {days.map((date, idx) => {
          const profit = profitByDate.get(date) || 0;
          return (
            <div
              key={date}
              className="analytics-heatmap-cell"
              title={`${date}: ${formatNumber(profit, numberFormat)}`}
              style={{ background: colorFor(profit, posSteps, negSteps) }}
              onMouseEnter={() => setHovered({ date, profit })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onCellClick?.(date)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

> **NOTE:** The heatmap reads from `allBuckets` (a separate query for the fixed last-365-days window) — passed in by `ProfitTab`.

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ProfitHeatmap.jsx
git commit -m "feat(analytics): add ProfitHeatmap widget"
```

---

## Phase C: Wire widgets into `ProfitTab`

### Task C1: Replace `ProfitTab` placeholder with the real layout

**Files:**
- Modify: `src/components/analytics/ProfitTab.jsx`

- [ ] **Step 1: Replace placeholder content**

```jsx
// src/components/analytics/ProfitTab.jsx
import React, { useMemo } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import ProfitOverTimeChart from './widgets/ProfitOverTimeChart';
import CumulativeProfitChart from './widgets/CumulativeProfitChart';
import ProfitBySourceChart from './widgets/ProfitBySourceChart';
import GpTradedChart from './widgets/GpTradedChart';
import PeriodComparisonCards from './widgets/PeriodComparisonCards';
import BestDaysTable from './widgets/BestDaysTable';
import ProfitKpiStrip from './widgets/ProfitKpiStrip';
import ProfitHeatmap from './widgets/ProfitHeatmap';
import '../../styles/analytics-widgets.css';

const subtractDays = (iso, days) => {
  const d = new Date(iso); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};
const addDays = (iso, days) => {
  const d = new Date(iso); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const subtractYears = (iso, years) => {
  const d = new Date(iso); d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));

const periodLabelFor = (window) => {
  switch (window) {
    case '1W': return 'week';
    case '1M': return 'month';
    case '3M': return 'quarter';
    case '6M': return '6 months';
    case '1Y': return 'year';
    default:   return 'period';
  }
};

export default function ProfitTab({
  userId,
  buckets,
  priorBuckets,
  timeframe,
  transactions,
  stocks,
  profitHistory,
  numberFormat,
  onNavigateToHistory,
  totalProfitAllTime,
  fallbackData,
}) {
  const span = daysBetween(timeframe.start, timeframe.end);
  const lastPeriodStart = subtractDays(timeframe.start, span);
  const samePeriodLYStart = subtractYears(timeframe.start, 1);
  const samePeriodLYEnd   = subtractYears(timeframe.end, 1);

  const lastPeriod = useAnalytics({
    userId, start: lastPeriodStart, end: addDays(timeframe.start, -1), bucket: timeframe.bucket, fallbackData,
  });
  const samePeriodLY = useAnalytics({
    userId, start: samePeriodLYStart, end: samePeriodLYEnd, bucket: timeframe.bucket, fallbackData,
  });
  const last365 = useAnalytics({
    userId,
    start: subtractDays(timeframe.end, 365),
    end: timeframe.end,
    bucket: 'day',
    fallbackData,
  });

  const allTimeBaseline = useMemo(
    () => Math.max(0, totalProfitAllTime - (buckets || []).reduce((s, b) => s + b.profit_items + b.profit_dump + b.profit_referral + b.profit_bonds, 0)),
    [totalProfitAllTime, buckets]
  );

  return (
    <div className="analytics-stack">
      <ProfitOverTimeChart buckets={buckets} numberFormat={numberFormat} />
      <CumulativeProfitChart buckets={buckets} allTimeBaseline={allTimeBaseline} numberFormat={numberFormat} />
      <div className="analytics-grid-2">
        <ProfitBySourceChart buckets={buckets} numberFormat={numberFormat} />
        <GpTradedChart buckets={buckets} numberFormat={numberFormat} />
      </div>
      <PeriodComparisonCards
        thisPeriod={buckets}
        lastPeriod={lastPeriod.buckets}
        samePeriodLastYear={samePeriodLY.buckets}
        periodLabel={periodLabelFor(timeframe.window)}
        numberFormat={numberFormat}
      />
      <div className="analytics-grid-2">
        <BestDaysTable
          buckets={buckets}
          transactions={transactions}
          stocks={stocks}
          profitHistory={profitHistory}
          numberFormat={numberFormat}
          onNavigateToHistory={onNavigateToHistory}
        />
        <ProfitKpiStrip
          currentBuckets={buckets}
          priorBuckets={priorBuckets}
          numberFormat={numberFormat}
        />
      </div>
      <ProfitHeatmap
        allBuckets={last365.buckets}
        numberFormat={numberFormat}
        onCellClick={(date) => onNavigateToHistory?.(date)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `AnalyticsPage` to pass new props**

In `src/pages/AnalyticsPage.jsx`, change the `<ProfitTab>` usage to include the new props. Replace the existing line:

If `AnalyticsPage` does not already receive `navigateToPage`, add it to the page props and pass it from `MainApp.jsx`.

```jsx
{mountedTabs.has('profit')     && <div hidden={activeTab !== 'profit'}>     <ProfitTab     buckets={current.buckets} timeframe={tf} numberFormat={numberFormat} /></div>}
```

with:

```jsx
{mountedTabs.has('profit') && (
  <div hidden={activeTab !== 'profit'}>
    <ProfitTab
      userId={userId}
      buckets={current.buckets}
      priorBuckets={prior.buckets}
      timeframe={tf}
      transactions={transactions}
      stocks={stocksForStats}
      profitHistory={profitHistory}
      numberFormat={numberFormat}
      onNavigateToHistory={(date) => navigateToPage('history', { query: { dateFrom: date, dateTo: date } })}
      totalProfitAllTime={totalProfit}
      fallbackData={fallbackData}
    />
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Navigate to `/analytics`. Each timeframe pill should produce visible chart updates. Hover every section header, KPI, chart control, and modal button, and expect exactly one styled tooltip. Toggle the "Window baseline" button on Cumulative; the line should explicitly reset the visible window to zero while default mode keeps all-time cumulative values consistent across timeframes. Toggle "Show sell count" on GP traded; a yellow count line appears. Heatmap shows 365 cells for the last year and explains that lighter/brighter green means more profit.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/ProfitTab.jsx src/pages/AnalyticsPage.jsx
git commit -m "feat(analytics): wire all profit-tab widgets"
```

---

## Manual verification checklist

- [ ] Profit-over-time line chart renders, with zero baseline reference
- [ ] Cumulative profit area chart renders; "Window baseline" toggle changes baseline while default all-time values stay consistent across filters
- [ ] Profit-by-source stacked bars render with all 4 source colors and a legend
- [ ] GP-traded bars render from complete transaction data; "Show sell count" toggle adds a yellow line
- [ ] Period comparison shows three cards; if the user has < 1 year of history, the same-period-last-year card says "Not enough history"
- [ ] Best periods table shows best days/weeks/months/years with its own timeframe selector; clicking a row triggers history navigation
- [ ] Profit KPI strip shows three KPIs with deltas
- [ ] Heatmap shows 365 cells with color gradients; hovering shows date + profit
- [ ] All charts respect the global timeframe selector
- [ ] No console errors

---

## Self-review notes

Spec coverage check (Profit tab section):

- Widget 1 Profit over time — ✅ Task B1
- Widget 2 Cumulative profit + window baseline toggle — ✅ Task B2
- Widget 3 Profit by source stacked bar — ✅ Task B3
- Widget 4 GP traded bar + tx-count overlay — ✅ Task B4
- Widget 5 Period comparison cards — ✅ Task B5
- Widget 6 Best periods — ✅ Task B6
- Widget 7 KPI strip (avg/sell, avg margin, win rate) — ✅ Task B7
- Widget 8 Profit heatmap — ✅ Task B8

Edge cases:
- "Not enough history" handled in `PeriodComparisonCards`.
- Empty bucket array → empty state in `ProfitOverTimeChart` (other widgets degrade gracefully).
- Heatmap uses its own fixed 365-day window via a separate `useAnalytics` call.
