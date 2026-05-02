# Analytics Page — Plan 3: Items Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the Items tab on `/analytics` with eight widgets: full sortable items table (no top-10 cap), filter bar, item drilldown drawer, movers list, buying-vs-selling activity chart, stale-inventory table, ROI distribution histogram, and CSV export.

**Architecture:** All widgets read from `stocks` (already in `TradeContext`), `transactions`, and `profitHistory`. Per-item profit-in-window comes from joining transactions to stocks within the timeframe. The drilldown drawer reuses `useTimeseries` for GE price overlay. CSV export is a pure browser download (no server round-trip).

**Tech Stack:** React 18, recharts, lucide-react.

**Reference spec:** `docs/superpowers/specs/2026-05-02-analytics-page-design.md` § Items tab

**Prerequisite:** Plan 1 must be merged.

---

## File Structure

**Created:**
- `src/components/analytics/widgets/ItemsTable.jsx`
- `src/components/analytics/widgets/ItemsFilterBar.jsx`
- `src/components/analytics/widgets/ItemDrilldownDrawer.jsx`
- `src/components/analytics/widgets/MoversList.jsx`
- `src/components/analytics/widgets/BuyingVsSellingChart.jsx`
- `src/components/analytics/widgets/StaleInventoryTable.jsx`
- `src/components/analytics/widgets/RoiHistogram.jsx`
- `src/components/analytics/widgets/ExportCsvButton.jsx`
- `src/utils/itemAnalytics.js` — per-item aggregation helpers
- `src/utils/itemAnalytics.test.js`
- `src/styles/analytics-items.css`

**Modified:**
- `src/components/analytics/ItemsTab.jsx` — replace placeholder with real layout

---

## Phase A: Per-item aggregation helpers

### Task A1: `itemAnalytics.js` — pure helpers

**Files:**
- Create: `src/utils/itemAnalytics.js`
- Test: `src/utils/itemAnalytics.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/utils/itemAnalytics.test.js
import { describe, it, expect } from 'vitest';
import {
  computeItemMetrics,
  computeMovers,
  computeStaleInventory,
  computeBuyingVsSelling,
  buildRoiHistogram,
  toCsv,
} from './itemAnalytics';

const stock = (overrides = {}) => ({
  id: 1,
  name: 'Cannonball',
  category: 'Ammo',
  shares: 0,
  totalCost: 0,
  sharesSold: 0,
  totalCostSold: 0,
  totalCostBasisSold: 0,
  archived: false,
  itemId: 2,
  ...overrides,
});
const tx = (overrides = {}) => ({
  id: 1, user_id: 'u', stock_id: 1, type: 'sell',
  total: 0, cost_basis: 0, shares: 0, date: '2026-04-15',
  ...overrides,
});

describe('computeItemMetrics', () => {
  it('joins window transactions onto stocks and computes window-scoped numbers', () => {
    const stocks = [stock({ id: 1, shares: 10, totalCost: 100 })];
    const transactions = [
      tx({ id: 1, type: 'buy',  total: 100, shares: 10, date: '2026-04-15' }),
      tx({ id: 2, type: 'sell', total: 200, cost_basis: 120, shares: 6, date: '2026-04-16' }),
    ];
    const out = computeItemMetrics({ stocks, transactions, start: '2026-04-15', end: '2026-04-30' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 1,
      name: 'Cannonball',
      windowProfit: 80,
      windowGpTraded: 300,
      windowSells: 1,
      roiPct: expect.closeTo((80 / 120) * 100, 1),
    });
  });

  it('respects archived flag in result', () => {
    const stocks = [stock({ id: 1, archived: true })];
    const out = computeItemMetrics({ stocks, transactions: [], start: '2026-04-01', end: '2026-04-30' });
    expect(out[0].archived).toBe(true);
  });
});

describe('computeMovers', () => {
  it('returns top gainers and losers', () => {
    const items = [
      { id: 1, name: 'A', windowProfit: 1000 },
      { id: 2, name: 'B', windowProfit: -500 },
      { id: 3, name: 'C', windowProfit: 300 },
    ];
    const { gainers, losers } = computeMovers(items, 5);
    expect(gainers[0].name).toBe('A');
    expect(losers[0].name).toBe('B');
  });
});

describe('computeStaleInventory', () => {
  it('flags items held longer than threshold without recent sells', () => {
    const items = [stock({ id: 1, shares: 5, totalCost: 500 })];
    const transactions = [tx({ id: 1, type: 'buy', total: 500, shares: 5, date: '2026-01-01' })];
    const out = computeStaleInventory({ items, transactions, today: new Date('2026-05-02'), thresholdDays: 30 });
    expect(out).toHaveLength(1);
    expect(out[0].daysSinceLastSell).toBeGreaterThanOrEqual(120);
  });
});

describe('buildRoiHistogram', () => {
  it('bins items by margin', () => {
    const items = [
      { roiPct: -5 }, { roiPct: 2 }, { roiPct: 6 }, { roiPct: 15 }, { roiPct: 30 }, { roiPct: 80 },
    ];
    const out = buildRoiHistogram(items);
    expect(out.find(b => b.label === '<0%').count).toBe(1);
    expect(out.find(b => b.label === '0–5%').count).toBe(1);
    expect(out.find(b => b.label === '5–10%').count).toBe(1);
    expect(out.find(b => b.label === '10–20%').count).toBe(1);
    expect(out.find(b => b.label === '20–50%').count).toBe(1);
    expect(out.find(b => b.label === '>50%').count).toBe(1);
  });
});

describe('computeBuyingVsSelling', () => {
  it('computes net direction per item in window', () => {
    const out = computeBuyingVsSelling({
      stocks: [stock({ id: 1, name: 'A' }), stock({ id: 2, name: 'B' })],
      transactions: [
        tx({ stock_id: 1, type: 'buy',  total: 100 }),
        tx({ stock_id: 1, type: 'sell', total: 50  }),
        tx({ stock_id: 2, type: 'sell', total: 200 }),
      ],
      start: '2026-04-15', end: '2026-04-30',
    });
    expect(out.find(r => r.name === 'A').net).toBe(50);  // bought 50 more
    expect(out.find(r => r.name === 'B').net).toBe(-200);
  });
});

describe('toCsv', () => {
  it('produces escaped CSV', () => {
    const csv = toCsv([{ a: 1, b: 'hi, "world"' }]);
    expect(csv).toContain('a,b');
    expect(csv).toContain('1,"hi, ""world"""');
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

Run: `npm test -- itemAnalytics`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement helpers**

```js
// src/utils/itemAnalytics.js
const inWindow = (iso, start, end) => iso >= start && iso <= end;
const isoOf = (d) => String(d).slice(0, 10);

export function computeItemMetrics({ stocks, transactions, start, end }) {
  const byStock = new Map();
  for (const s of stocks) {
    byStock.set(s.id, {
      ...s,
      windowProfit: 0,
      windowGpTraded: 0,
      windowSells: 0,
      windowBuys: 0,
      windowBasis: 0,
      lastSellDate: null,
      firstBuyDate: null,
    });
  }
  for (const tx of transactions) {
    const iso = isoOf(tx.date);
    const m = byStock.get(tx.stock_id);
    if (!m) continue;
    if (tx.type === 'buy') {
      if (!m.firstBuyDate || iso < m.firstBuyDate) m.firstBuyDate = iso;
      if (inWindow(iso, start, end)) {
        m.windowGpTraded += Number(tx.total) || 0;
        m.windowBuys += 1;
      }
    } else if (tx.type === 'sell') {
      if (!m.lastSellDate || iso > m.lastSellDate) m.lastSellDate = iso;
      if (inWindow(iso, start, end)) {
        const profit = (Number(tx.total) || 0) - (Number(tx.cost_basis) || 0);
        m.windowProfit += profit;
        m.windowGpTraded += Number(tx.total) || 0;
        m.windowSells += 1;
        m.windowBasis += Number(tx.cost_basis) || 0;
      }
    }
  }
  return [...byStock.values()].map(m => ({
    ...m,
    roiPct: m.windowBasis > 0 ? (m.windowProfit / m.windowBasis) * 100 : 0,
    daysHeld: m.firstBuyDate ? Math.floor((Date.now() - new Date(m.firstBuyDate)) / 86400000) : 0,
  }));
}

export function computeMovers(items, n = 5) {
  const sorted = [...items].sort((a, b) => b.windowProfit - a.windowProfit);
  return {
    gainers: sorted.slice(0, n),
    losers:  [...items].sort((a, b) => a.windowProfit - b.windowProfit).slice(0, n),
  };
}

export function computeStaleInventory({ items, transactions, today = new Date(), thresholdDays = 30 }) {
  const lastSellByStock = new Map();
  for (const tx of transactions) {
    if (tx.type !== 'sell') continue;
    const prev = lastSellByStock.get(tx.stock_id);
    const iso = isoOf(tx.date);
    if (!prev || iso > prev) lastSellByStock.set(tx.stock_id, iso);
  }
  const todayIso = today.toISOString().slice(0, 10);
  return items
    .filter(s => s.shares > 0 && !s.archived)
    .map(s => {
      const last = lastSellByStock.get(s.id);
      const daysSinceLastSell = last
        ? Math.floor((new Date(todayIso) - new Date(last)) / 86400000)
        : Infinity;
      return { ...s, daysSinceLastSell };
    })
    .filter(s => s.daysSinceLastSell >= thresholdDays)
    .sort((a, b) => b.totalCost - a.totalCost);
}

export function computeBuyingVsSelling({ stocks, transactions, start, end }) {
  const byStock = new Map(stocks.map(s => [s.id, { id: s.id, name: s.name, buys: 0, sells: 0 }]));
  for (const tx of transactions) {
    if (!inWindow(isoOf(tx.date), start, end)) continue;
    const m = byStock.get(tx.stock_id);
    if (!m) continue;
    if (tx.type === 'buy')  m.buys  += Number(tx.total) || 0;
    if (tx.type === 'sell') m.sells += Number(tx.total) || 0;
  }
  return [...byStock.values()]
    .map(m => ({ ...m, net: m.buys - m.sells }))
    .filter(m => m.buys > 0 || m.sells > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

const ROI_BINS = [
  { label: '<0%',    test: r => r < 0 },
  { label: '0–5%',   test: r => r >= 0  && r < 5 },
  { label: '5–10%',  test: r => r >= 5  && r < 10 },
  { label: '10–20%', test: r => r >= 10 && r < 20 },
  { label: '20–50%', test: r => r >= 20 && r < 50 },
  { label: '>50%',   test: r => r >= 50 },
];

export function buildRoiHistogram(items) {
  return ROI_BINS.map(bin => ({
    label: bin.label,
    count: items.filter(i => bin.test(i.roiPct)).length,
  }));
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- itemAnalytics`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/itemAnalytics.js src/utils/itemAnalytics.test.js
git commit -m "feat(analytics): add per-item aggregation helpers"
```

---

## Phase B: Widgets

### Task B1: `ItemsFilterBar`

**Files:**
- Create: `src/components/analytics/widgets/ItemsFilterBar.jsx`
- Create: `src/styles/analytics-items.css`

- [ ] **Step 1: Stylesheet**

```css
/* src/styles/analytics-items.css */
.items-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  align-items: center;
  padding: 0.625rem 0.875rem;
  background: rgb(22, 30, 46);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 0.625rem;
  margin-bottom: 1rem;
}

.items-filter-pill {
  background: rgba(51, 65, 85, 0.5);
  color: rgb(203, 213, 225);
  border: 1px solid rgba(71, 85, 105, 0.6);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
}
.items-filter-pill.is-on {
  background: rgb(168, 85, 247);
  color: white;
  border-color: rgb(168, 85, 247);
}

.items-table-wrap {
  overflow: auto;
  max-height: 36rem;
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 0.625rem;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  color: white;
}
.items-table thead th {
  position: sticky;
  top: 0;
  background: rgb(15, 23, 42);
  border-bottom: 1px solid rgb(51, 65, 85);
  padding: 0.5rem;
  text-align: left;
  cursor: pointer;
}
.items-table tbody td { padding: 0.4rem 0.5rem; border-bottom: 1px solid rgba(51, 65, 85, 0.5); }
.items-table tbody tr:hover { background: rgba(168, 85, 247, 0.08); cursor: pointer; }

.items-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(28rem, 100%);
  height: 100vh;
  background: rgb(15, 23, 42);
  border-left: 1px solid rgb(51, 65, 85);
  padding: 1.25rem;
  overflow-y: auto;
  z-index: 250;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.4);
}
.items-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 240;
}
```

- [ ] **Step 2: Implement**

```jsx
// src/components/analytics/widgets/ItemsFilterBar.jsx
import React from 'react';

export default function ItemsFilterBar({
  categories,
  selectedCategories,
  onToggleCategory,
  hasStockOnly,
  onToggleHasStock,
  soldInWindowOnly,
  onToggleSoldInWindow,
  showArchived,
  onToggleArchived,
}) {
  return (
    <div className="items-filter-bar">
      <span style={{ color: 'rgb(148, 163, 184)', fontSize: '0.75rem' }}>Filters:</span>
      <button
        type="button"
        className={`items-filter-pill${hasStockOnly ? ' is-on' : ''}`}
        onClick={onToggleHasStock}
      >Has stock only</button>
      <button
        type="button"
        className={`items-filter-pill${soldInWindowOnly ? ' is-on' : ''}`}
        onClick={onToggleSoldInWindow}
      >Sold in window</button>
      <button
        type="button"
        className={`items-filter-pill${showArchived ? ' is-on' : ''}`}
        onClick={onToggleArchived}
      >Include archived</button>
      <span style={{ color: 'rgb(148, 163, 184)', fontSize: '0.75rem' }}>·</span>
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          className={`items-filter-pill${selectedCategories.has(cat) ? ' is-on' : ''}`}
          onClick={() => onToggleCategory(cat)}
        >{cat}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analytics/widgets/ItemsFilterBar.jsx src/styles/analytics-items.css
git commit -m "feat(analytics): add ItemsFilterBar"
```

---

### Task B2: `ItemsTable` — sortable, virtualized

**Files:**
- Create: `src/components/analytics/widgets/ItemsTable.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ItemsTable.jsx
import React, { useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';

const COLUMNS = [
  { key: 'name',           label: 'Name' },
  { key: 'category',       label: 'Category' },
  { key: 'shares',         label: 'Held' },
  { key: 'totalCost',      label: 'Cost' },
  { key: 'windowProfit',   label: 'Profit (window)' },
  { key: 'roiPct',         label: 'ROI %' },
  { key: 'windowSells',    label: 'Sells (window)' },
  { key: 'windowGpTraded', label: 'GP traded (window)' },
  { key: 'daysHeld',       label: 'Days held' },
];

export default function ItemsTable({ items, numberFormat, onRowClick }) {
  const [sortKey, setSortKey] = useState('windowProfit');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const out = [...items];
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av - bv) : (bv - av);
    });
    return out;
  }, [items, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const fmt = (v, key) => {
    if (key === 'roiPct') return `${(v || 0).toFixed(1)}%`;
    if (typeof v === 'number') return formatNumber(v, numberFormat);
    return v;
  };

  return (
    <div className="items-table-wrap">
      <table className="items-table">
        <thead>
          <tr>
            {COLUMNS.map(c => (
              <th key={c.key} onClick={() => handleSort(c.key)}>
                {c.label}{sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(item => (
            <tr key={item.id} onClick={() => onRowClick?.(item)}>
              {COLUMNS.map(c => {
                const v = item[c.key];
                const cls = c.key === 'windowProfit'
                  ? (v >= 0 ? { color: 'rgb(34, 197, 94)' } : { color: 'rgb(239, 68, 68)' })
                  : {};
                return <td key={c.key} style={cls}>{fmt(v, c.key)}</td>;
              })}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '2rem', color: 'rgb(148, 163, 184)' }}>
              No items match these filters.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

> **NOTE:** This table is *not* virtualized in v1. With portfolios up to ~500 items the perf is fine. If needed later, swap in `react-window` (separate task, separate plan).

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ItemsTable.jsx
git commit -m "feat(analytics): add sortable ItemsTable"
```

---

### Task B3: `ItemDrilldownDrawer`

**Files:**
- Create: `src/components/analytics/widgets/ItemDrilldownDrawer.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ItemDrilldownDrawer.jsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTimeseries } from '../../../hooks/useTimeseries';
import { formatNumber } from '../../../utils/formatters';

export default function ItemDrilldownDrawer({ item, transactions, numberFormat, onClose }) {
  if (!item) return null;
  const { data: priceData } = useTimeseries(item.itemId || null, '24h');

  const itemTxs = useMemo(
    () => transactions.filter(tx => tx.stock_id === item.id).slice(0, 50),
    [transactions, item.id]
  );

  const profitSeries = useMemo(() => {
    const byDay = new Map();
    for (const tx of itemTxs) {
      if (tx.type !== 'sell') continue;
      const d = String(tx.date).slice(0, 10);
      const profit = (Number(tx.total) || 0) - (Number(tx.cost_basis) || 0);
      byDay.set(d, (byDay.get(d) || 0) + profit);
    }
    return [...byDay.entries()].sort().map(([date, profit]) => ({ date, profit }));
  }, [itemTxs]);

  return (
    <>
      <div className="items-drawer-overlay" onClick={onClose} />
      <aside className="items-drawer" role="dialog" aria-label={`${item.name} details`}>
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>✕</button>
        <h2 style={{ color: 'white', marginTop: 0 }}>{item.name}</h2>
        <p style={{ color: 'rgb(148, 163, 184)', fontSize: '0.8125rem' }}>{item.category}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.75rem 0' }}>
          <div><div className="analytics-kpi-mini-label">Held</div><div className="analytics-kpi-mini-value">{formatNumber(item.shares, numberFormat)}</div></div>
          <div><div className="analytics-kpi-mini-label">Cost</div><div className="analytics-kpi-mini-value">{formatNumber(item.totalCost, numberFormat)}</div></div>
          <div><div className="analytics-kpi-mini-label">Profit (window)</div><div className="analytics-kpi-mini-value">{formatNumber(item.windowProfit, numberFormat)}</div></div>
          <div><div className="analytics-kpi-mini-label">ROI %</div><div className="analytics-kpi-mini-value">{item.roiPct.toFixed(1)}%</div></div>
        </div>

        <h3 style={{ color: 'white', fontSize: '0.875rem' }}>Realized profit per day</h3>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitSeries}>
              <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={10} />
              <YAxis stroke="rgb(148, 163, 184)" fontSize={10} tickFormatter={v => formatNumber(v, numberFormat)} />
              <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }} />
              <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {priceData?.length > 0 && (
          <>
            <h3 style={{ color: 'white', fontSize: '0.875rem' }}>GE price (last 30d, hourly)</h3>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData.slice(-720).map(d => ({ ts: d.timestamp, high: d.avgHighPrice }))}>
                  <XAxis dataKey="ts" stroke="rgb(148, 163, 184)" fontSize={10} />
                  <YAxis stroke="rgb(148, 163, 184)" fontSize={10} tickFormatter={v => formatNumber(v, numberFormat)} />
                  <Line type="monotone" dataKey="high" stroke="rgb(96, 165, 250)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <h3 style={{ color: 'white', fontSize: '0.875rem' }}>Recent transactions</h3>
        <table className="analytics-bw-table">
          <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Total</th></tr></thead>
          <tbody>
            {itemTxs.map(tx => (
              <tr key={tx.id}>
                <td>{String(tx.date).slice(0, 10)}</td>
                <td>{tx.type}</td>
                <td>{tx.shares}</td>
                <td>{formatNumber(tx.total, numberFormat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ItemDrilldownDrawer.jsx
git commit -m "feat(analytics): add ItemDrilldownDrawer"
```

---

### Task B4: `MoversList`

**Files:**
- Create: `src/components/analytics/widgets/MoversList.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/MoversList.jsx
import React from 'react';
import { formatNumber } from '../../../utils/formatters';

const Row = ({ item, numberFormat, onClick }) => (
  <li onClick={() => onClick?.(item)} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
      <span style={{ color: 'white' }}>{item.name}</span>
      <span style={{ color: item.windowProfit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)', fontWeight: 600 }}>
        {formatNumber(item.windowProfit, numberFormat)}
      </span>
    </div>
  </li>
);

export default function MoversList({ gainers, losers, numberFormat, onItemClick }) {
  return (
    <div className="analytics-grid-2">
      <div className="analytics-widget">
        <div className="analytics-widget-header"><h3 className="analytics-widget-title">Top gainers</h3></div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {gainers.length === 0 && <li style={{ color: 'rgb(148, 163, 184)' }}>No data</li>}
          {gainers.map(g => <Row key={g.id} item={g} numberFormat={numberFormat} onClick={onItemClick} />)}
        </ul>
      </div>
      <div className="analytics-widget">
        <div className="analytics-widget-header"><h3 className="analytics-widget-title">Top losers</h3></div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {losers.length === 0 && <li style={{ color: 'rgb(148, 163, 184)' }}>No data</li>}
          {losers.map(l => <Row key={l.id} item={l} numberFormat={numberFormat} onClick={onItemClick} />)}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/MoversList.jsx
git commit -m "feat(analytics): add MoversList widget"
```

---

### Task B5: `BuyingVsSellingChart`

**Files:**
- Create: `src/components/analytics/widgets/BuyingVsSellingChart.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/BuyingVsSellingChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

export default function BuyingVsSellingChart({ rows, numberFormat }) {
  const data = rows.slice(0, 12).map(r => ({ name: r.name, net: r.net }));
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Buying vs selling (window)</h3>
        <p className="analytics-widget-subtitle" style={{ margin: 0 }}>Positive = net buying</p>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="rgb(148, 163, 184)" fontSize={11}
              tickFormatter={v => formatNumber(v, numberFormat)} />
            <YAxis type="category" dataKey="name" stroke="rgb(148, 163, 184)" fontSize={11} width={120} />
            <ReferenceLine x={0} stroke="rgb(71, 85, 105)" />
            <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }}
              formatter={v => [formatNumber(v, numberFormat), 'Net GP']} />
            <Bar dataKey="net" fill="rgb(96, 165, 250)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/BuyingVsSellingChart.jsx
git commit -m "feat(analytics): add BuyingVsSellingChart widget"
```

---

### Task B6: `StaleInventoryTable`

**Files:**
- Create: `src/components/analytics/widgets/StaleInventoryTable.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/StaleInventoryTable.jsx
import React, { useState, useMemo } from 'react';
import { computeStaleInventory } from '../../../utils/itemAnalytics';
import { formatNumber } from '../../../utils/formatters';

const THRESHOLDS = [7, 30, 90, 180];

export default function StaleInventoryTable({ items, transactions, numberFormat, onRowClick }) {
  const [threshold, setThreshold] = useState(30);
  const stale = useMemo(
    () => computeStaleInventory({ items, transactions, thresholdDays: threshold }),
    [items, transactions, threshold]
  );

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">Stale inventory</h3>
        <select
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ background: 'rgb(15, 23, 42)', color: 'white', border: '1px solid rgb(51, 65, 85)', borderRadius: 4, padding: '0.25rem 0.5rem' }}
        >
          {THRESHOLDS.map(d => <option key={d} value={d}>≥ {d} days</option>)}
        </select>
      </div>
      <div className="items-table-wrap" style={{ maxHeight: '20rem' }}>
        <table className="items-table">
          <thead><tr><th>Item</th><th>Held</th><th>Cost</th><th>Days idle</th></tr></thead>
          <tbody>
            {stale.map(s => (
              <tr key={s.id} onClick={() => onRowClick?.(s)}>
                <td>{s.name}</td>
                <td>{formatNumber(s.shares, numberFormat)}</td>
                <td>{formatNumber(s.totalCost, numberFormat)}</td>
                <td>{Number.isFinite(s.daysSinceLastSell) ? s.daysSinceLastSell : 'never'}</td>
              </tr>
            ))}
            {stale.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'rgb(148, 163, 184)', padding: '1.5rem' }}>No stale items</td></tr>
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
git add src/components/analytics/widgets/StaleInventoryTable.jsx
git commit -m "feat(analytics): add StaleInventoryTable widget"
```

---

### Task B7: `RoiHistogram`

**Files:**
- Create: `src/components/analytics/widgets/RoiHistogram.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/RoiHistogram.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { buildRoiHistogram } from '../../../utils/itemAnalytics';

const COLORS = ['rgb(239, 68, 68)','rgb(234, 179, 8)','rgb(96, 165, 250)','rgb(52, 211, 153)','rgb(34, 197, 94)','rgb(168, 85, 247)'];

export default function RoiHistogram({ items }) {
  const data = buildRoiHistogram(items);
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3 className="analytics-widget-title">ROI distribution</h3>
        <p className="analytics-widget-subtitle" style={{ margin: 0 }}>Items per margin band (window)</p>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis stroke="rgb(148, 163, 184)" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgb(51, 65, 85)' }} />
            <Bar dataKey="count">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
git add src/components/analytics/widgets/RoiHistogram.jsx
git commit -m "feat(analytics): add RoiHistogram widget"
```

---

### Task B8: `ExportCsvButton`

**Files:**
- Create: `src/components/analytics/widgets/ExportCsvButton.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/analytics/widgets/ExportCsvButton.jsx
import React from 'react';
import { toCsv } from '../../../utils/itemAnalytics';

export default function ExportCsvButton({ rows, filename = 'items.csv' }) {
  const handleClick = () => {
    const csv = toCsv(rows.map(r => ({
      name: r.name,
      category: r.category,
      shares: r.shares,
      totalCost: r.totalCost,
      windowProfit: r.windowProfit,
      roiPct: r.roiPct,
      windowSells: r.windowSells,
      windowGpTraded: r.windowGpTraded,
      daysHeld: r.daysHeld,
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="analytics-toggle"
      style={{ background: 'rgb(168, 85, 247)', color: 'white', borderColor: 'rgb(168, 85, 247)' }}
    >
      Export CSV ({rows.length})
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/widgets/ExportCsvButton.jsx
git commit -m "feat(analytics): add ExportCsvButton widget"
```

---

## Phase C: Wire widgets into `ItemsTab`

### Task C1: Replace `ItemsTab` placeholder

**Files:**
- Modify: `src/components/analytics/ItemsTab.jsx`
- Modify: `src/pages/AnalyticsPage.jsx` — pass new props

- [ ] **Step 1: Implement `ItemsTab`**

```jsx
// src/components/analytics/ItemsTab.jsx
import React, { useMemo, useState } from 'react';
import {
  computeItemMetrics,
  computeMovers,
  computeBuyingVsSelling,
} from '../../utils/itemAnalytics';
import ItemsFilterBar from './widgets/ItemsFilterBar';
import ItemsTable from './widgets/ItemsTable';
import ItemDrilldownDrawer from './widgets/ItemDrilldownDrawer';
import MoversList from './widgets/MoversList';
import BuyingVsSellingChart from './widgets/BuyingVsSellingChart';
import StaleInventoryTable from './widgets/StaleInventoryTable';
import RoiHistogram from './widgets/RoiHistogram';
import ExportCsvButton from './widgets/ExportCsvButton';
import '../../styles/analytics-items.css';

export default function ItemsTab({ stocks, transactions, timeframe, numberFormat }) {
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [hasStockOnly, setHasStockOnly] = useState(false);
  const [soldInWindowOnly, setSoldInWindowOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [drillItem, setDrillItem] = useState(null);

  const items = useMemo(
    () => computeItemMetrics({ stocks, transactions, start: timeframe.start, end: timeframe.end }),
    [stocks, transactions, timeframe.start, timeframe.end]
  );

  const categories = useMemo(
    () => [...new Set(items.map(i => i.category).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (!showArchived && i.archived) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(i.category)) return false;
      if (hasStockOnly && i.shares <= 0) return false;
      if (soldInWindowOnly && i.windowSells <= 0) return false;
      return true;
    });
  }, [items, selectedCategories, hasStockOnly, soldInWindowOnly, showArchived]);

  const { gainers, losers } = useMemo(() => computeMovers(filtered, 5), [filtered]);
  const buyingSelling = useMemo(
    () => computeBuyingVsSelling({ stocks, transactions, start: timeframe.start, end: timeframe.end }),
    [stocks, transactions, timeframe.start, timeframe.end]
  );

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="analytics-stack">
      <ItemsFilterBar
        categories={categories}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        hasStockOnly={hasStockOnly}
        onToggleHasStock={() => setHasStockOnly(v => !v)}
        soldInWindowOnly={soldInWindowOnly}
        onToggleSoldInWindow={() => setSoldInWindowOnly(v => !v)}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(v => !v)}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <ExportCsvButton rows={filtered} filename={`items-${timeframe.window}.csv`} />
      </div>

      <ItemsTable items={filtered} numberFormat={numberFormat} onRowClick={setDrillItem} />

      <MoversList gainers={gainers} losers={losers} numberFormat={numberFormat} onItemClick={setDrillItem} />

      <div className="analytics-grid-2">
        <BuyingVsSellingChart rows={buyingSelling} numberFormat={numberFormat} />
        <RoiHistogram items={filtered} />
      </div>

      <StaleInventoryTable
        items={items}
        transactions={transactions}
        numberFormat={numberFormat}
        onRowClick={setDrillItem}
      />

      {drillItem && (
        <ItemDrilldownDrawer
          item={drillItem}
          transactions={transactions}
          numberFormat={numberFormat}
          onClose={() => setDrillItem(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Pass props from `AnalyticsPage`**

In `src/pages/AnalyticsPage.jsx`, replace the `<ItemsTab>` line:

```jsx
{mountedTabs.has('items') && (
  <div hidden={activeTab !== 'items'}>
    <ItemsTab
      stocks={stocksForStats}
      transactions={transactions || []}
      timeframe={tf}
      numberFormat={numberFormat}
    />
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`, click Items tab. Expect:
- Filter bar with category pills, has-stock-only, sold-in-window-only, include-archived toggles.
- Sortable table populated. Click a column header → sort flips.
- Click a row → drawer slides in from the right with item details.
- Movers gainers/losers populated.
- Buying-vs-selling horizontal bar chart.
- ROI histogram.
- Stale inventory table; threshold dropdown changes the rows.
- Export CSV button downloads a file.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/ItemsTab.jsx src/pages/AnalyticsPage.jsx
git commit -m "feat(analytics): wire all items-tab widgets"
```

---

## Manual verification checklist

- [ ] All filters work and combine correctly
- [ ] Sort flips ascending/descending on repeat clicks
- [ ] Row click opens drawer; click overlay or ✕ closes it
- [ ] Drawer shows recent transactions and (when itemId is set) GE price overlay
- [ ] Stale inventory threshold selector updates the table
- [ ] CSV downloads correctly and matches the filtered table contents
- [ ] No console errors

---

## Self-review notes

Spec coverage check (Items tab):

- Widget 1 Full sortable items table — ✅ Task B2
- Widget 2 Filter bar — ✅ Task B1
- Widget 4 Item drilldown drawer — ✅ Task B3
- Widget 5 Movers — ✅ Task B4
- Widget 6 Buying vs selling — ✅ Task B5
- Widget 7 Stale inventory — ✅ Task B6
- Widget 8 ROI histogram — ✅ Task B7
- Widget 9 Export CSV — ✅ Task B8

Edge cases:
- Items table empty state ("No items match these filters.") in Task B2.
- Drawer falls back gracefully when `itemId` isn't set (no GE price overlay).
- Stale inventory shows "never" for items with no historical sells.
