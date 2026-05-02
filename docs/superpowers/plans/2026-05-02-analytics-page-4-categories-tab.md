# Analytics Page — Plan 4: Categories Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the Categories tab on `/analytics` with seven widgets: category profit-over-time stacked area, category breakdown table, category share donut (multi-metric), category period comparison, category contribution bar, category margin chart, and inventory treemap.

**Architecture:** Per-category time-series comes from the `by_category` jsonb returned in each bucket (already computed by the RPC and the local fallback). Snapshot metrics (donut, breakdown table, treemap) come directly from `stocks`. The treemap uses Recharts' built-in `Treemap`.

**Tech Stack:** React 18, recharts, lucide-react.

**Reference spec:** `docs/superpowers/specs/2026-05-02-analytics-page-design.md` § Categories tab

**Prerequisite:** Plan 1 must be merged.

---

## File Structure

**Created:**
- `src/components/analytics/widgets/CategoryStackedAreaChart.jsx`
- `src/components/analytics/widgets/CategoryBreakdownTable.jsx`
- `src/components/analytics/widgets/CategoryShareDonut.jsx`
- `src/components/analytics/widgets/CategoryPeriodComparison.jsx`
- `src/components/analytics/widgets/CategoryContributionBar.jsx`
- `src/components/analytics/widgets/CategoryMarginChart.jsx`
- `src/components/analytics/widgets/InventoryTreemap.jsx`
- `src/utils/categoryAnalytics.js`
- `src/utils/categoryAnalytics.test.js`

**Modified:**
- `src/components/analytics/CategoriesTab.jsx` — replace placeholder

---

## Phase A: Per-category aggregation helpers

### Task A1: `categoryAnalytics.js`

**Files:**
- Create: `src/utils/categoryAnalytics.js`
- Test: `src/utils/categoryAnalytics.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/utils/categoryAnalytics.test.js
import { describe, it, expect } from 'vitest';
import {
  pivotCategoryTimeseries,
  computeCategoryBreakdown,
  computeCategoryShareSnapshot,
  computeCategoryContribution,
  computeInventoryByCategory,
} from './categoryAnalytics';

describe('pivotCategoryTimeseries', () => {
  it('produces one row per bucket with one column per category', () => {
    const buckets = [
      { bucket_date: '2026-04-15', by_category: { Runes: 100, Logs: 50 } },
      { bucket_date: '2026-04-16', by_category: { Runes: 200 } },
    ];
    const { rows, categories } = pivotCategoryTimeseries(buckets);
    expect(categories).toEqual(['Logs', 'Runes']);
    expect(rows).toEqual([
      { date: '2026-04-15', Runes: 100, Logs: 50 },
      { date: '2026-04-16', Runes: 200, Logs: 0 },
    ]);
  });
});

describe('computeCategoryBreakdown', () => {
  it('aggregates per-category snapshot + window stats', () => {
    const stocks = [
      { id: 1, category: 'Runes', shares: 10, totalCost: 100, sharesSold: 5, totalCostSold: 75, totalCostBasisSold: 50 },
      { id: 2, category: 'Runes', shares: 0,  totalCost: 0,   sharesSold: 0, totalCostSold: 0,  totalCostBasisSold: 0 },
      { id: 3, category: 'Logs',  shares: 0,  totalCost: 0,   sharesSold: 8, totalCostSold: 200,totalCostBasisSold: 150 },
    ];
    const buckets = [{
      bucket_date: '2026-04-15',
      by_category: { Runes: 25, Logs: 50 },
      gp_traded: 0, profit_items: 0, profit_dump: 0, profit_referral: 0, profit_bonds: 0, sells_count: 0, wins_count: 0,
    }];
    const out = computeCategoryBreakdown({ stocks, buckets });
    expect(out.find(r => r.category === 'Runes')).toMatchObject({
      uniqueItems: 2,
      inventoryValue: 100,
      windowProfit: 25,
    });
    expect(out.find(r => r.category === 'Logs')).toMatchObject({
      uniqueItems: 1,
      windowProfit: 50,
    });
  });
});

describe('computeCategoryShareSnapshot', () => {
  it('returns slices for the chosen metric', () => {
    const stocks = [
      { category: 'A', totalCost: 100, shares: 10 },
      { category: 'A', totalCost: 50,  shares: 5 },
      { category: 'B', totalCost: 200, shares: 0 },
    ];
    const out = computeCategoryShareSnapshot({ stocks, metric: 'totalCost' });
    expect(out.find(s => s.name === 'A').value).toBe(150);
    expect(out.find(s => s.name === 'B').value).toBe(200);
  });
});

describe('computeCategoryContribution', () => {
  it('returns each category as a fraction of total window profit', () => {
    const buckets = [{ by_category: { A: 75, B: 25 } }];
    const out = computeCategoryContribution(buckets);
    expect(out.find(c => c.category === 'A').pct).toBeCloseTo(75);
    expect(out.find(c => c.category === 'B').pct).toBeCloseTo(25);
  });
});

describe('computeInventoryByCategory', () => {
  it('sums totalCost per category, drops zeros', () => {
    const stocks = [
      { category: 'A', totalCost: 100 },
      { category: 'A', totalCost: 50 },
      { category: 'B', totalCost: 0 },
    ];
    const out = computeInventoryByCategory(stocks);
    expect(out).toEqual([{ name: 'A', value: 150 }]);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm test -- categoryAnalytics`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement**

```js
// src/utils/categoryAnalytics.js
export function pivotCategoryTimeseries(buckets) {
  const cats = new Set();
  for (const b of buckets) for (const c of Object.keys(b.by_category || {})) cats.add(c);
  const categories = [...cats].sort();
  const rows = buckets.map(b => {
    const row = { date: b.bucket_date };
    for (const cat of categories) row[cat] = b.by_category?.[cat] || 0;
    return row;
  });
  return { rows, categories };
}

export function computeCategoryBreakdown({ stocks, buckets }) {
  const byCat = new Map();
  for (const s of stocks) {
    const cat = s.category || 'Uncategorized';
    if (!byCat.has(cat)) byCat.set(cat, {
      category: cat,
      uniqueItems: 0,
      inventoryValue: 0,
      totalRealized: 0,
      basis: 0,
      gpTradedAllTime: 0,
      windowProfit: 0,
    });
    const m = byCat.get(cat);
    m.uniqueItems += s.shares > 0 ? 1 : 0;
    m.inventoryValue += s.totalCost || 0;
    m.totalRealized += (s.totalCostSold || 0) - (s.totalCostBasisSold || 0);
    m.basis += s.totalCostBasisSold || 0;
    m.gpTradedAllTime += (s.totalCost || 0) + (s.totalCostSold || 0);
  }
  for (const b of buckets) {
    for (const [cat, p] of Object.entries(b.by_category || {})) {
      if (!byCat.has(cat)) byCat.set(cat, {
        category: cat, uniqueItems: 0, inventoryValue: 0, totalRealized: 0, basis: 0, gpTradedAllTime: 0, windowProfit: 0,
      });
      byCat.get(cat).windowProfit += p;
    }
  }
  return [...byCat.values()].map(c => ({
    ...c,
    avgMarginPct: c.basis > 0 ? (c.totalRealized / c.basis) * 100 : 0,
  }));
}

export function computeCategoryShareSnapshot({ stocks, metric }) {
  const byCat = new Map();
  for (const s of stocks) {
    const cat = s.category || 'Uncategorized';
    let v = 0;
    switch (metric) {
      case 'totalCost':  v = s.totalCost  || 0; break;
      case 'shares':     v = s.shares     || 0; break;
      case 'profit':     v = (s.totalCostSold || 0) - (s.totalCostBasisSold || 0); break;
      case 'soldCost':   v = s.totalCostSold || 0; break;
      case 'soldShares': v = s.sharesSold  || 0; break;
      default: v = 0;
    }
    byCat.set(cat, (byCat.get(cat) || 0) + v);
  }
  return [...byCat.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function computeCategoryContribution(buckets) {
  const totals = new Map();
  for (const b of buckets) {
    for (const [cat, p] of Object.entries(b.by_category || {})) {
      totals.set(cat, (totals.get(cat) || 0) + p);
    }
  }
  const grand = [...totals.values()].reduce((s, v) => s + Math.abs(v), 0);
  return [...totals.entries()]
    .map(([category, profit]) => ({ category, profit, pct: grand > 0 ? (profit / grand) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit);
}

export function computeInventoryByCategory(stocks) {
  const byCat = new Map();
  for (const s of stocks) {
    const cat = s.category || 'Uncategorized';
    byCat.set(cat, (byCat.get(cat) || 0) + (s.totalCost || 0));
  }
  return [...byCat.entries()]
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- categoryAnalytics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/categoryAnalytics.js src/utils/categoryAnalytics.test.js
git commit -m "feat(analytics): add per-category aggregation helpers"
```

---

## Phase B: Widgets

### Task B1: `CategoryStackedAreaChart`

**Files:**
- Create: `src/components/analytics/widgets/CategoryStackedAreaChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryStackedAreaChart.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { pivotCategoryTimeseries } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PALETTE = [
  'rgb(96, 165, 250)','rgb(52, 211, 153)','rgb(168, 85, 247)','rgb(251, 146, 60)',
  'rgb(234, 179, 8)','rgb(239, 68, 68)','rgb(34, 197, 94)','rgb(244, 114, 182)',
];

export default function CategoryStackedAreaChart({ buckets, numberFormat }) {
  const { rows, categories } = pivotCategoryTimeseries(buckets);
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Category profit over time</h3>
      </div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={v => formatNumber(v, numberFormat)} />
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
              formatter={v => formatNumber(v, numberFormat)}
            />
            <Legend wrapperStyle={{ color: 'rgb(148, 163, 184)', fontSize: 11 }} />
            {categories.map((cat, i) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stackId="profit"
                stroke={PALETTE[i % PALETTE.length]}
                fill={PALETTE[i % PALETTE.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CategoryStackedAreaChart.jsx
git commit -m "feat(analytics): add CategoryStackedAreaChart widget"
```

---

### Task B2: `CategoryBreakdownTable`

**Files:**
- Create: `src/components/analytics/widgets/CategoryBreakdownTable.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryBreakdownTable.jsx
import React, { useState, useMemo } from 'react';
import { formatNumber } from '../../../utils/formatters';

const COLUMNS = [
  { key: 'category',        label: 'Category' },
  { key: 'uniqueItems',     label: 'Items' },
  { key: 'inventoryValue',  label: 'Inventory value' },
  { key: 'gpTradedAllTime', label: 'GP traded' },
  { key: 'windowProfit',    label: 'Profit (window)' },
  { key: 'avgMarginPct',    label: 'Avg margin %' },
];

export default function CategoryBreakdownTable({ rows, numberFormat }) {
  const [sortKey, setSortKey] = useState('windowProfit');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return out;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const fmt = (v, key) => {
    if (key === 'avgMarginPct') return `${(v || 0).toFixed(1)}%`;
    if (typeof v === 'number') return formatNumber(v, numberFormat);
    return v;
  };

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Category breakdown</h3>
      </div>
      <div className="items-table-wrap">
        <table className="items-table">
          <thead>
            <tr>{COLUMNS.map(c => (
              <th key={c.key} onClick={() => handleSort(c.key)}>
                {c.label}{sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.category}>
                {COLUMNS.map(c => {
                  const cls = c.key === 'windowProfit'
                    ? { color: r.windowProfit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }
                    : {};
                  return <td key={c.key} style={cls}>{fmt(r[c.key], c.key)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CategoryBreakdownTable.jsx
git commit -m "feat(analytics): add CategoryBreakdownTable widget"
```

---

### Task B3: `CategoryShareDonut`

**Files:**
- Create: `src/components/analytics/widgets/CategoryShareDonut.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryShareDonut.jsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { computeCategoryShareSnapshot } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PALETTE = [
  'rgb(96, 165, 250)','rgb(52, 211, 153)','rgb(168, 85, 247)','rgb(251, 146, 60)',
  'rgb(234, 179, 8)','rgb(239, 68, 68)','rgb(34, 197, 94)','rgb(244, 114, 182)',
];

const METRICS = [
  { key: 'totalCost',  label: 'Total Cost' },
  { key: 'shares',     label: 'Quantity' },
  { key: 'profit',     label: 'Profit' },
  { key: 'soldCost',   label: 'Sold Cost' },
  { key: 'soldShares', label: 'Sold Quantity' },
];

export default function CategoryShareDonut({ stocks, numberFormat }) {
  const [metric, setMetric] = useState('totalCost');
  const data = computeCategoryShareSnapshot({ stocks, metric });

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Category share</h3>
        <select
          value={metric}
          onChange={e => setMetric(e.target.value)}
          style={{ background: 'rgb(15, 23, 42)', color: 'white', border: '1px solid rgb(51, 65, 85)', borderRadius: 4, padding: '0.25rem 0.5rem' }}
        >
          {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
              formatter={v => formatNumber(v, numberFormat)}
            />
            <Legend wrapperStyle={{ color: 'rgb(148, 163, 184)', fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CategoryShareDonut.jsx
git commit -m "feat(analytics): add CategoryShareDonut widget"
```

---

### Task B4: `CategoryPeriodComparison`

**Files:**
- Create: `src/components/analytics/widgets/CategoryPeriodComparison.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryPeriodComparison.jsx
import React, { useMemo } from 'react';
import { formatNumber } from '../../../utils/formatters';

const sumByCategory = (buckets) => {
  const map = new Map();
  for (const b of buckets) {
    for (const [cat, p] of Object.entries(b.by_category || {})) {
      map.set(cat, (map.get(cat) || 0) + p);
    }
  }
  return map;
};

export default function CategoryPeriodComparison({ currentBuckets, priorBuckets, numberFormat }) {
  const rows = useMemo(() => {
    const cur = sumByCategory(currentBuckets);
    const pri = sumByCategory(priorBuckets);
    const cats = new Set([...cur.keys(), ...pri.keys()]);
    return [...cats].map(cat => {
      const c = cur.get(cat) || 0;
      const p = pri.get(cat) || 0;
      const delta = c - p;
      const pct = p !== 0 ? (delta / Math.abs(p)) * 100 : null;
      return { category: cat, current: c, prior: p, delta, pct };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [currentBuckets, priorBuckets]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Category period comparison</h3>
        <p className="analytics-widget-subtitle" style={{ margin: 0 }}>Current vs prior window</p>
      </div>
      <div className="items-table-wrap" style={{ maxHeight: '20rem' }}>
        <table className="items-table">
          <thead><tr><th>Category</th><th>Current</th><th>Prior</th><th>Δ</th><th>Δ %</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.category}>
                <td>{r.category}</td>
                <td>{formatNumber(r.current, numberFormat)}</td>
                <td>{formatNumber(r.prior, numberFormat)}</td>
                <td style={{ color: r.delta >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                  {formatNumber(r.delta, numberFormat)}
                </td>
                <td style={{ color: (r.pct ?? 0) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                  {r.pct == null ? '—' : `${r.pct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgb(148, 163, 184)', padding: '1rem' }}>No data</td></tr>
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
git add src/components/analytics/widgets/CategoryPeriodComparison.jsx
git commit -m "feat(analytics): add CategoryPeriodComparison widget"
```

---

### Task B5: `CategoryContributionBar`

**Files:**
- Create: `src/components/analytics/widgets/CategoryContributionBar.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryContributionBar.jsx
import React from 'react';
import { computeCategoryContribution } from '../../../utils/categoryAnalytics';

const PALETTE = [
  'rgb(96, 165, 250)','rgb(52, 211, 153)','rgb(168, 85, 247)','rgb(251, 146, 60)',
  'rgb(234, 179, 8)','rgb(239, 68, 68)','rgb(34, 197, 94)','rgb(244, 114, 182)',
];

export default function CategoryContributionBar({ buckets }) {
  const rows = computeCategoryContribution(buckets);
  if (rows.length === 0) {
    return (
      <div className="analytics-widget">
        <div className="analytics-widget-header"><h3 className="analytics-widget-title">Category contribution</h3></div>
        <div className="analytics-widget-empty">No window profit yet.</div>
      </div>
    );
  }
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Category contribution</h3>
        <p className="analytics-widget-subtitle" style={{ margin: 0 }}>% of window profit</p>
      </div>
      <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid rgb(51, 65, 85)' }}>
        {rows.map((r, i) => (
          <div
            key={r.category}
            title={`${r.category}: ${r.pct.toFixed(1)}%`}
            style={{ width: `${Math.max(0, r.pct)}%`, background: PALETTE[i % PALETTE.length] }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.625rem', color: 'rgb(203, 213, 225)', fontSize: '0.75rem' }}>
        {rows.map((r, i) => (
          <div key={r.category} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
            {r.category} ({r.pct.toFixed(1)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CategoryContributionBar.jsx
git commit -m "feat(analytics): add CategoryContributionBar widget"
```

---

### Task B6: `CategoryMarginChart`

**Files:**
- Create: `src/components/analytics/widgets/CategoryMarginChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/CategoryMarginChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function CategoryMarginChart({ rows }) {
  const data = [...rows]
    .map(r => ({ category: r.category, margin: r.avgMarginPct }))
    .sort((a, b) => b.margin - a.margin);
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Avg margin by category</h3>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="category" stroke="rgb(148, 163, 184)" fontSize={11} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11} tickFormatter={v => `${v.toFixed(0)}%`} />
            <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
            <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
              formatter={v => [`${v.toFixed(1)}%`, 'Avg margin']} />
            <Bar dataKey="margin">
              {data.map((d, i) => (
                <Cell key={i} fill={d.margin >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/CategoryMarginChart.jsx
git commit -m "feat(analytics): add CategoryMarginChart widget"
```

---

### Task B7: `InventoryTreemap`

**Files:**
- Create: `src/components/analytics/widgets/InventoryTreemap.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/InventoryTreemap.jsx
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { computeInventoryByCategory } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PALETTE = [
  'rgb(96, 165, 250)','rgb(52, 211, 153)','rgb(168, 85, 247)','rgb(251, 146, 60)',
  'rgb(234, 179, 8)','rgb(239, 68, 68)','rgb(34, 197, 94)','rgb(244, 114, 182)',
];

const TreemapContent = (props) => {
  const { x, y, width, height, name, value, index } = props;
  if (width < 0 || height < 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={PALETTE[index % PALETTE.length]} stroke="rgb(15, 23, 42)" />
      {width > 60 && height > 30 && (
        <>
          <text x={x + 6} y={y + 18} fill="white" fontSize={12} fontWeight={600}>{name}</text>
          <text x={x + 6} y={y + 32} fill="rgba(255,255,255,0.85)" fontSize={11}>{(value/1_000_000).toFixed(1)}M</text>
        </>
      )}
    </g>
  );
};

export default function InventoryTreemap({ stocks, numberFormat }) {
  const data = computeInventoryByCategory(stocks);
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Inventory tied up by category</h3>
      </div>
      <div style={{ height: 260 }}>
        {data.length === 0
          ? <div className="analytics-widget-empty">No inventory.</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={data} dataKey="value" aspectRatio={1.5} stroke="#0f172a" content={<TreemapContent />}>
                <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
                  formatter={v => formatNumber(v, numberFormat)} />
              </Treemap>
            </ResponsiveContainer>
          )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/InventoryTreemap.jsx
git commit -m "feat(analytics): add InventoryTreemap widget"
```

---

## Phase C: Wire widgets into `CategoriesTab`

### Task C1: Replace placeholder

**Files:**
- Modify: `src/components/analytics/CategoriesTab.jsx`
- Modify: `src/pages/AnalyticsPage.jsx`

- [ ] **Step 1: Implement `CategoriesTab`**

```jsx
// src/components/analytics/CategoriesTab.jsx
import React, { useMemo } from 'react';
import CategoryStackedAreaChart from './widgets/CategoryStackedAreaChart';
import CategoryBreakdownTable from './widgets/CategoryBreakdownTable';
import CategoryShareDonut from './widgets/CategoryShareDonut';
import CategoryPeriodComparison from './widgets/CategoryPeriodComparison';
import CategoryContributionBar from './widgets/CategoryContributionBar';
import CategoryMarginChart from './widgets/CategoryMarginChart';
import InventoryTreemap from './widgets/InventoryTreemap';
import { computeCategoryBreakdown } from '../../utils/categoryAnalytics';

export default function CategoriesTab({ buckets, priorBuckets, stocks, numberFormat }) {
  const breakdown = useMemo(
    () => computeCategoryBreakdown({ stocks, buckets }),
    [stocks, buckets]
  );

  return (
    <div className="analytics-stack">
      <CategoryStackedAreaChart buckets={buckets} numberFormat={numberFormat} />
      <CategoryContributionBar buckets={buckets} />
      <div className="analytics-grid-2">
        <CategoryShareDonut stocks={stocks} numberFormat={numberFormat} />
        <CategoryMarginChart rows={breakdown} />
      </div>
      <CategoryBreakdownTable rows={breakdown} numberFormat={numberFormat} />
      <CategoryPeriodComparison
        currentBuckets={buckets}
        priorBuckets={priorBuckets}
        numberFormat={numberFormat}
      />
      <InventoryTreemap stocks={stocks} numberFormat={numberFormat} />
    </div>
  );
}
```

- [ ] **Step 2: Pass props from `AnalyticsPage`**

In `src/pages/AnalyticsPage.jsx`, replace the `<CategoriesTab>` line:

```jsx
{mountedTabs.has('categories') && (
  <div hidden={activeTab !== 'categories'}>
    <CategoriesTab
      buckets={current.buckets}
      priorBuckets={prior.buckets}
      stocks={stocksForStats}
      numberFormat={numberFormat}
    />
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, click Categories tab. Expect:
- Stacked area chart populated per category.
- Contribution bar with category legend.
- Donut with metric switcher (5 options).
- Margin bar chart, color-coded.
- Sortable breakdown table.
- Period-comparison table sorted by largest delta.
- Treemap rendering inventory tile sizes.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/CategoriesTab.jsx src/pages/AnalyticsPage.jsx
git commit -m "feat(analytics): wire all categories-tab widgets"
```

---

## Manual verification checklist

- [ ] Stacked area chart draws all categories
- [ ] Donut metric switcher updates slices live
- [ ] Breakdown table sorts on column header click
- [ ] Period comparison table shows current vs prior, color-coded deltas
- [ ] Contribution bar adds to ~100%
- [ ] Margin chart green/red bars correctly
- [ ] Treemap renders with category labels and sizes
- [ ] No console errors

---

## Self-review notes

Spec coverage check (Categories tab):

- Widget 1 Category profit over time (stacked area) — ✅ Task B1
- Widget 2 Category breakdown table — ✅ Task B2
- Widget 3 Category share donut multi-metric — ✅ Task B3
- Widget 4 Category period comparison — ✅ Task B4
- Widget 6 Category contribution bar — ✅ Task B5
- Widget 7 Category margin chart — ✅ Task B6
- Widget 8 Inventory treemap — ✅ Task B7

(Widget 5 — category drilldown to item list — was excluded during brainstorming.)

Edge cases:
- Empty `by_category` falls through pivot with no columns and an empty chart.
- Donut switches between metrics without remounting.
- Treemap empty state renders friendly message.
