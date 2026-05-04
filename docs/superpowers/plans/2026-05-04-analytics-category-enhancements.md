# Analytics Category Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add category drilldown, selected-window trades count, selected-window turnover, and a category by time profit heatmap to the Analytics Categories tab.

**Architecture:** Keep all changes client-side using existing `buckets`, `stocks`, `transactions`, `profitHistory`, and live GE prices already passed into `CategoriesTab`. Extend `categoryAnalytics.js` as the shared data boundary, then keep visual work in focused widgets. Reuse the item drawer and analytics heatmap patterns rather than introducing new UI systems.

**Tech Stack:** React 18, Recharts, lucide-react, existing CSS files in `src/styles/`, Vite build verification.

---

## File Structure

**Modify:**
- `src/utils/categoryAnalytics.js` - add selected-window trade counts, average inventory exposure, turnover, heatmap rows, and drilldown data helpers.
- `src/components/analytics/CategoriesTab.jsx` - wire the new metrics, heatmap, row click state, and drawer.
- `src/components/analytics/widgets/CategoryBreakdownTable.jsx` - add Trades and Turnover columns and row click behavior.
- `src/styles/analytics-widgets.css` - add scoped styles for clickable category rows, heatmap labels/cells, drawer lists, and compact drawer charts.

**Create:**
- `src/components/analytics/widgets/CategoryTimeHeatmap.jsx` - SVG category by time profit heatmap.
- `src/components/analytics/widgets/CategoryDrilldownDrawer.jsx` - right-side category drill panel.

**Verify only:**
- No automated test files, test runners, or test dependencies.
- Run `npm run build`.
- Run a manual browser pass for desktop and mobile after implementation.

---

## Task 1: Extend Category Analytics Helpers

**Files:**
- Modify: `src/utils/categoryAnalytics.js`

- [ ] **Step 1: Add row fields for the new metrics**

In `src/utils/categoryAnalytics.js`, update `emptyCategoryRow` so every category row starts with the new fields:

```js
const emptyCategoryRow = (category) => ({
  category,
  uniqueItems: 0,
  inventoryValue: 0,
  currentQuantity: 0,
  totalRealized: 0,
  basis: 0,
  soldQuantity: 0,
  gpTradedAllTime: 0,
  gpTradedWindow: 0,
  unrealizedProfit: 0,
  windowBasis: 0,
  windowProfit: 0,
  tradesWindow: 0,
  avgInventoryWindow: 0,
  turnoverPct: null,
});
```

- [ ] **Step 2: Add date and transaction helper functions**

Add these helpers after `isoOf`:

```js
const MS_PER_DAY = 86400000;

const parseIsoDateUtc = (iso) => {
  const [year, month, day] = String(iso || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (iso, days) => {
  const date = parseIsoDateUtc(iso);
  if (!date) return iso;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const enumerateDays = (start, end) => {
  const startDate = parseIsoDateUtc(start);
  const endDate = parseIsoDateUtc(end);
  if (!startDate || !endDate || startDate > endDate) return [];

  const days = [];
  const span = Math.round((endDate - startDate) / MS_PER_DAY);
  for (let offset = 0; offset <= span; offset += 1) {
    days.push(addDays(start, offset));
  }
  return days;
};

const isTradeType = (type) => type === 'buy' || type === 'sell';
```

- [ ] **Step 3: Count selected-window buy/sell trades while preserving existing GP and basis logic**

Inside `addTransactionWindowMetrics`, replace:

```js
if (inWindow) row.gpTradedWindow += total;
```

with:

```js
if (inWindow && isTradeType(transaction.type)) {
  row.gpTradedWindow += total;
  row.tradesWindow += 1;
}
```

Keep the existing buy/sell position logic below that line.

- [ ] **Step 4: Add average inventory exposure helper**

Add this function before `computeCategoryBreakdown`:

```js
export function computeCategoryAverageInventory({
  stocks = [],
  transactions = [],
  start,
  end,
}) {
  if (!start || !end) return new Map();

  const days = enumerateDays(start, end);
  if (!days.length) return new Map();

  const stocksById = new Map((stocks || []).map((stock) => [String(stock.id), stock]));
  const positions = new Map((stocks || []).map((stock) => [
    String(stock.id),
    {
      stock,
      shares: 0,
      cost: 0,
    },
  ]));
  const sortedTransactions = [...(transactions || [])]
    .filter((transaction) => stocksById.has(String(stockIdOf(transaction))))
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  let txIndex = 0;
  const totals = new Map();

  for (const day of days) {
    while (
      txIndex < sortedTransactions.length
      && isoOf(sortedTransactions[txIndex].date) <= day
    ) {
      const transaction = sortedTransactions[txIndex];
      const stock = stocksById.get(String(stockIdOf(transaction)));
      const key = String(stock.id);
      const position = positions.get(key) || { stock, shares: 0, cost: 0 };
      const shares = toNumber(transaction.shares);
      const total = toNumber(transaction.total);

      if (transaction.type === 'buy') {
        position.shares += shares;
        position.cost += total;
      }

      if (transaction.type === 'sell') {
        const avgCost = position.shares > 0 ? position.cost / position.shares : 0;
        const estimatedBasis = avgCost * shares;
        position.shares = Math.max(0, position.shares - shares);
        position.cost = Math.max(0, position.cost - estimatedBasis);
      }

      positions.set(key, position);
      txIndex += 1;
    }

    for (const position of positions.values()) {
      const category = categoryOf(position.stock);
      totals.set(category, (totals.get(category) || 0) + Math.max(0, position.cost));
    }
  }

  const averages = new Map();
  for (const [category, total] of totals.entries()) {
    averages.set(category, total / days.length);
  }

  return averages;
}
```

- [ ] **Step 5: Apply average inventory and turnover in `computeCategoryBreakdown`**

Inside `computeCategoryBreakdown`, after `addTransactionWindowMetrics(...)`, add:

```js
const avgInventoryByCategory = computeCategoryAverageInventory({
  stocks,
  transactions,
  start,
  end,
});

for (const [category, avgInventory] of avgInventoryByCategory.entries()) {
  ensureCategory(byCategory, category).avgInventoryWindow = avgInventory;
}
```

Then replace the returned `.map((row) => ({ ... }))` with:

```js
.map((row) => {
  const turnoverPct = row.avgInventoryWindow > 0
    ? (row.windowProfit / row.avgInventoryWindow) * 100
    : null;

  return {
    ...row,
    avgMarginPct: row.windowBasis > 0 ? (row.windowProfit / row.windowBasis) * 100 : 0,
    turnoverPct,
  };
})
```

- [ ] **Step 6: Add heatmap row helper**

Add this export near `sumBucketsByCategory`:

```js
export function buildCategoryHeatmapRows({ buckets = [], categories = [] }) {
  const categorySet = new Set(categories || []);

  if (categorySet.size === 0) {
    for (const bucket of buckets || []) {
      for (const category of Object.keys(bucket.by_category || {})) {
        categorySet.add(category);
      }
    }
  }

  const dates = (buckets || []).map((bucket) => bucket.bucket_date).filter(Boolean);

  return [...categorySet].sort().map((category) => ({
    category,
    cells: dates.map((date) => {
      const bucket = (buckets || []).find((row) => row.bucket_date === date);
      return {
        date,
        profit: toNumber(bucket?.by_category?.[category]),
      };
    }),
  }));
}
```

- [ ] **Step 7: Add category drawer data helper**

Add this export at the end of `categoryAnalytics.js`:

```js
export function buildCategoryDrilldownData({
  category,
  breakdownRows = [],
  buckets = [],
  stocks = [],
  transactions = [],
  start,
  end,
  limit = 12,
}) {
  const matchingStocks = (stocks || []).filter((stock) => categoryOf(stock) === category);
  const stockIds = new Set(matchingStocks.map((stock) => String(stock.id)));
  const metrics = breakdownRows.find((row) => row.category === category) || emptyCategoryRow(category);
  const profitSeries = (buckets || []).map((bucket) => ({
    date: bucket.bucket_date,
    profit: toNumber(bucket.by_category?.[category]),
  }));
  const recentTransactions = (transactions || [])
    .filter((transaction) => stockIds.has(String(stockIdOf(transaction))))
    .filter((transaction) => isTradeType(transaction.type))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, limit);
  const windowTransactions = (transactions || [])
    .filter((transaction) => stockIds.has(String(stockIdOf(transaction))))
    .filter((transaction) => isTradeType(transaction.type))
    .filter((transaction) => {
      const iso = isoOf(transaction.date);
      return !start || !end || (iso >= start && iso <= end);
    });
  const topItems = matchingStocks
    .map((stock) => ({
      ...stock,
      windowGpTraded: windowTransactions
        .filter((transaction) => String(stockIdOf(transaction)) === String(stock.id))
        .reduce((sum, transaction) => sum + toNumber(transaction.total), 0),
      totalRealized: toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold),
    }))
    .sort((a, b) => (
      (toNumber(b.windowGpTraded) || toNumber(b.totalRealized))
      - (toNumber(a.windowGpTraded) || toNumber(a.totalRealized))
    ))
    .slice(0, limit);

  return {
    category,
    metrics,
    profitSeries,
    topItems,
    recentTransactions,
  };
}
```

- [ ] **Step 8: Verify syntax through build after helper edits**

Run:

```powershell
npm run build
```

Expected:

```text
vite v...
...built...
```

- [ ] **Step 9: Commit helper changes**

Run:

```powershell
git add -- src/utils/categoryAnalytics.js
git commit -m "feat(analytics): add category turnover metrics"
```

---

## Task 2: Add Trades and Turnover to Category Breakdown Table

**Files:**
- Modify: `src/components/analytics/widgets/CategoryBreakdownTable.jsx`
- Modify: `src/styles/analytics-widgets.css`

- [ ] **Step 1: Add the new table columns**

In `CategoryBreakdownTable.jsx`, insert these column definitions between `gpTradedWindow` and `windowProfit`:

```js
{
  key: 'tradesWindow',
  label: 'Trades',
  tooltip: 'Buy and sell transaction count in the selected timeframe.',
},
{
  key: 'turnoverPct',
  label: 'Turnover',
  tooltip: 'Selected-timeframe category profit divided by average inventory tied up over the same timeframe. Estimated from loaded transactions and current stock data.',
},
```

- [ ] **Step 2: Make the new keys numeric and format turnover**

Add the new keys to `numericKeys`:

```js
'tradesWindow',
'turnoverPct',
```

Update `formatCell`:

```js
const formatCell = (row, key, numberFormat) => {
  const value = row[key];
  if (key === 'avgMarginPct') return `${(Number(value) || 0).toFixed(1)}%`;
  if (key === 'turnoverPct') {
    if (value == null || !Number.isFinite(Number(value))) return '-';
    return `${Number(value).toFixed(1)}%`;
  }
  if (numericKeys.has(key)) return formatNumber(value, numberFormat);
  return value || '-';
};
```

Update `valueClass`:

```js
const valueClass = (key, value) => {
  if (
    key !== 'windowProfit'
    && key !== 'avgMarginPct'
    && key !== 'turnoverPct'
    && key !== 'unrealizedProfit'
  ) return '';
  if ((Number(value) || 0) < 0) return 'items-profit-negative';
  return 'items-profit-positive';
};
```

- [ ] **Step 3: Add click callback prop and row accessibility**

Change the component signature:

```js
export default function CategoryBreakdownTable({
  rows = [],
  totalCategories = rows.length,
  timeframeLabel = 'selected',
  numberFormat,
  onRowClick,
}) {
```

Replace the visible row markup:

```jsx
{visibleRows.map((row) => (
  <tr
    className={`category-table-row${onRowClick ? ' is-clickable' : ''}`}
    key={row.category}
    tabIndex={onRowClick ? 0 : undefined}
    onClick={() => onRowClick?.(row)}
    onKeyDown={(event) => {
      if (!onRowClick) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onRowClick(row);
      }
    }}
  >
    {COLUMNS.map((column) => (
      <td key={column.key} className={valueClass(column.key, row[column.key])}>
        {formatCell(row, column.key, numberFormat)}
      </td>
    ))}
  </tr>
))}
```

- [ ] **Step 4: Update dynamic column labels**

Inside the header button label, replace the current label condition with:

```jsx
<span>
  {column.key === 'windowProfit' && `Profit (${timeframeLabel})`}
  {column.key === 'gpTradedWindow' && `GP traded (${timeframeLabel})`}
  {column.key === 'tradesWindow' && `Trades (${timeframeLabel})`}
  {column.key === 'turnoverPct' && `Turnover (${timeframeLabel})`}
  {column.key === 'avgMarginPct' && `Margin (${timeframeLabel})`}
  {!['windowProfit', 'gpTradedWindow', 'tradesWindow', 'turnoverPct', 'avgMarginPct'].includes(column.key) && column.label}
</span>
```

- [ ] **Step 5: Add CSS for clickable category rows**

Append to `src/styles/analytics-widgets.css` near the existing `.category-table` rules:

```css
.category-table-row.is-clickable {
  cursor: pointer;
}

.category-table-row.is-clickable:hover,
.category-table-row.is-clickable:focus-visible {
  background: rgba(34, 197, 94, 0.08);
  outline: none;
}
```

- [ ] **Step 6: Verify build**

Run:

```powershell
npm run build
```

Expected: build completes without `turnoverPct`, `tradesWindow`, or JSX syntax errors.

- [ ] **Step 7: Commit table changes**

Run:

```powershell
git add -- src/components/analytics/widgets/CategoryBreakdownTable.jsx src/styles/analytics-widgets.css
git commit -m "feat(analytics): add category trades and turnover columns"
```

---

## Task 3: Add Category Time Heatmap Widget

**Files:**
- Create: `src/components/analytics/widgets/CategoryTimeHeatmap.jsx`
- Modify: `src/styles/analytics-widgets.css`

- [ ] **Step 1: Create `CategoryTimeHeatmap.jsx`**

Create `src/components/analytics/widgets/CategoryTimeHeatmap.jsx`:

```jsx
import React, { useMemo, useState } from 'react';
import { buildCategoryHeatmapRows } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const CELL_WIDTH = 34;
const CELL_HEIGHT = 18;
const LABEL_WIDTH = 132;
const HEADER_HEIGHT = 24;
const GAP = 3;

function quantiles(values, count) {
  const sorted = [...values].filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return [];

  const out = [];
  for (let index = 1; index <= count; index += 1) {
    const quantileIndex = Math.floor((sorted.length * index) / count) - 1;
    const clampedIndex = Math.max(0, Math.min(sorted.length - 1, quantileIndex));
    out.push(sorted[clampedIndex]);
  }
  return out;
}

function colorFor(profit, posSteps, negSteps) {
  if (profit === 0) return 'rgb(30, 41, 59)';

  if (profit > 0) {
    const idx = posSteps.findIndex((threshold) => profit <= threshold);
    const shadeIndex = idx === -1 ? posSteps.length - 1 : idx;
    const shades = ['#1f3b2c', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
    return shades[Math.min(Math.max(shadeIndex, 0), shades.length - 1)];
  }

  const loss = Math.abs(profit);
  const idx = negSteps.findIndex((threshold) => loss <= threshold);
  const shadeIndex = idx === -1 ? negSteps.length - 1 : idx;
  const shades = ['#3b1f24', '#7f1d1d', '#b91c1c', '#dc2626', '#f87171'];
  return shades[Math.min(Math.max(shadeIndex, 0), shades.length - 1)];
}

export default function CategoryTimeHeatmap({
  buckets = [],
  categories = [],
  timeframeLabel = 'selected',
  numberFormat,
}) {
  const [hovered, setHovered] = useState(null);
  const rows = useMemo(
    () => buildCategoryHeatmapRows({ buckets, categories }),
    [buckets, categories]
  );
  const dates = useMemo(
    () => (buckets || []).map((bucket) => bucket.bucket_date).filter(Boolean),
    [buckets]
  );
  const values = useMemo(
    () => rows.flatMap((row) => row.cells.map((cell) => cell.profit)),
    [rows]
  );
  const posSteps = useMemo(() => quantiles(values, 5), [values]);
  const negSteps = useMemo(
    () => quantiles(values.filter((value) => value < 0).map((value) => Math.abs(value)), 5),
    [values]
  );
  const width = LABEL_WIDTH + dates.length * (CELL_WIDTH + GAP);
  const height = HEADER_HEIGHT + rows.length * (CELL_HEIGHT + GAP);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Category profit by selected timeframe interval. Green cells are profit, red cells are losses, and brighter cells are stronger values."
          >
            Category time heatmap
          </h3>
          <p className="analytics-widget-subtitle">Rows are categories, columns are dates in {timeframeLabel}.</p>
        </div>
        {hovered && (
          <span className="analytics-widget-subtitle">
            {hovered.category} on {hovered.date}: {formatNumber(hovered.profit, numberFormat)}
          </span>
        )}
      </div>

      {rows.length === 0 || dates.length === 0 ? (
        <div className="analytics-widget-empty">No category profit in this window.</div>
      ) : (
        <div className="category-time-heatmap-wrap">
          <svg
            className="category-time-heatmap-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Category profit heatmap over time"
          >
            {dates.map((date, index) => (
              <text
                key={date}
                className="category-time-heatmap-date"
                x={LABEL_WIDTH + index * (CELL_WIDTH + GAP) + CELL_WIDTH / 2}
                y={14}
                textAnchor="middle"
              >
                {date.slice(5)}
              </text>
            ))}

            {rows.map((row, rowIndex) => {
              const y = HEADER_HEIGHT + rowIndex * (CELL_HEIGHT + GAP);
              return (
                <g key={row.category}>
                  <text
                    className="category-time-heatmap-label"
                    x={0}
                    y={y + 13}
                  >
                    {row.category}
                  </text>
                  {row.cells.map((cell, cellIndex) => {
                    const x = LABEL_WIDTH + cellIndex * (CELL_WIDTH + GAP);
                    const fill = colorFor(cell.profit, posSteps, negSteps);

                    return (
                      <rect
                        key={`${row.category}-${cell.date}`}
                        className="category-time-heatmap-cell"
                        x={x}
                        y={y}
                        width={CELL_WIDTH}
                        height={CELL_HEIGHT}
                        rx="3"
                        fill={fill}
                        tabIndex="0"
                        role="button"
                        aria-label={`${row.category} ${cell.date}: ${formatNumber(cell.profit, numberFormat)}`}
                        onMouseEnter={() => setHovered({ category: row.category, ...cell })}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered({ category: row.category, ...cell })}
                        onBlur={() => setHovered(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add heatmap styles**

Append to `src/styles/analytics-widgets.css`:

```css
.category-time-heatmap-wrap {
  overflow-x: auto;
}

.category-time-heatmap-svg {
  display: block;
  min-width: 46rem;
  width: 100%;
  height: auto;
}

.category-time-heatmap-date,
.category-time-heatmap-label {
  fill: rgb(148, 163, 184);
  font-size: 0.6875rem;
  font-weight: 700;
}

.category-time-heatmap-label {
  fill: rgb(226, 232, 240);
}

.category-time-heatmap-cell {
  cursor: help;
  stroke: rgba(15, 23, 42, 0.85);
  stroke-width: 1;
}

.category-time-heatmap-cell:focus {
  outline: none;
  stroke: white;
  stroke-width: 2;
}
```

- [ ] **Step 3: Verify build**

Run:

```powershell
npm run build
```

Expected: build completes and reports no missing export for `buildCategoryHeatmapRows`.

- [ ] **Step 4: Commit heatmap widget**

Run:

```powershell
git add -- src/components/analytics/widgets/CategoryTimeHeatmap.jsx src/styles/analytics-widgets.css
git commit -m "feat(analytics): add category time heatmap"
```

---

## Task 4: Add Category Drilldown Drawer

**Files:**
- Create: `src/components/analytics/widgets/CategoryDrilldownDrawer.jsx`
- Modify: `src/styles/analytics-widgets.css`

- [ ] **Step 1: Create `CategoryDrilldownDrawer.jsx`**

Create `src/components/analytics/widgets/CategoryDrilldownDrawer.jsx`:

```jsx
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildCategoryDrilldownData } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

function ChartTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      <div className="analytics-tooltip-row">
        <span>Profit</span>
        <span className="analytics-tooltip-value">
          {formatNumber(payload[0].value, numberFormat)}
        </span>
      </div>
    </div>
  );
}

const profitDomainFor = (series) => {
  const values = series.map((row) => Number(row.profit) || 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);

  if (min < 0 && max > 0) return [min, max];
  if (min < 0) return [min, 0];
  return [0, max || 1];
};

const formatTurnover = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return '-';
  return `${Number(value).toFixed(1)}%`;
};

export default function CategoryDrilldownDrawer({
  category,
  breakdownRows = [],
  buckets = [],
  stocks = [],
  transactions = [],
  timeframe,
  numberFormat,
  onClose,
}) {
  const data = useMemo(
    () => buildCategoryDrilldownData({
      category,
      breakdownRows,
      buckets,
      stocks,
      transactions,
      start: timeframe?.start,
      end: timeframe?.end,
    }),
    [category, breakdownRows, buckets, stocks, transactions, timeframe?.start, timeframe?.end]
  );
  const metrics = data.metrics;
  const timeframeLabel = timeframe?.window || 'selected';

  return (
    <>
      <div
        className="items-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <aside className="items-drawer" role="dialog" aria-modal="true" aria-label={`${category} category details`}>
        <div className="items-drawer-header">
          <div>
            <h2 className="items-drawer-title">{category}</h2>
            <p className="items-drawer-subtitle">Category analytics for {timeframeLabel}</p>
          </div>
          <button
            type="button"
            className="items-drawer-close has-tooltip"
            onClick={onClose}
            aria-label="Close category details"
            data-tooltip="Close this category drilldown."
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="items-drawer-kpis category-drawer-kpis">
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Selected-timeframe realized item profit from category buckets.">
            <div className="analytics-kpi-mini-label">Profit</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.windowProfit, numberFormat)}</div>
          </div>
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Buy and sell transaction count in the selected timeframe.">
            <div className="analytics-kpi-mini-label">Trades</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.tradesWindow, numberFormat)}</div>
          </div>
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Average category cost basis tied up across the selected timeframe, estimated from loaded transactions.">
            <div className="analytics-kpi-mini-label">Avg inventory</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.avgInventoryWindow, numberFormat)}</div>
          </div>
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Selected-window profit divided by average inventory tied up.">
            <div className="analytics-kpi-mini-label">Turnover</div>
            <div className="analytics-kpi-mini-value">{formatTurnover(metrics.turnoverPct)}</div>
          </div>
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Current cost basis still tied up in held stock.">
            <div className="analytics-kpi-mini-label">Current inventory</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.inventoryValue, numberFormat)}</div>
          </div>
          <div className="analytics-kpi-mini has-tooltip" data-tooltip="Estimated profit if current holdings sold now at live GE high after tax.">
            <div className="analytics-kpi-mini-label">Unrealized</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.unrealizedProfit, numberFormat)}</div>
          </div>
        </div>

        <section className="items-drawer-section">
          <h3 className="items-drawer-section-title has-tooltip" data-tooltip="Category profit from analytics buckets for the selected timeframe.">
            Profit trend
          </h3>
          {data.profitSeries.length === 0 ? (
            <div className="analytics-widget-empty">No category profit in this window.</div>
          ) : (
            <div className="items-chart is-drawer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.profitSeries}>
                  <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={10} />
                  <YAxis
                    domain={profitDomainFor(data.profitSeries)}
                    stroke="rgb(148, 163, 184)"
                    fontSize={10}
                    tickFormatter={(value) => formatNumber(value, numberFormat)}
                  />
                  <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
                  <Tooltip content={<ChartTooltip numberFormat={numberFormat} />} />
                  <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="items-drawer-section">
          <h3 className="items-drawer-section-title has-tooltip" data-tooltip="Items in this category sorted by selected-window GP traded, then all-time realized profit.">
            Top items
          </h3>
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Held</th>
                <th>Window GP</th>
              </tr>
            </thead>
            <tbody>
              {data.topItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatNumber(item.shares, numberFormat)}</td>
                  <td>{formatNumber(item.windowGpTraded, numberFormat)}</td>
                </tr>
              ))}
              {data.topItems.length === 0 && (
                <tr>
                  <td className="items-table-empty" colSpan={3}>
                    No items in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="items-drawer-section">
          <h3 className="items-drawer-section-title has-tooltip" data-tooltip="Most recent buy and sell transactions for this category.">
            Recent transactions
          </h3>
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{String(transaction.date).slice(0, 10)}</td>
                  <td><span className="items-badge">{transaction.type}</span></td>
                  <td>{formatNumber(transaction.shares, numberFormat)}</td>
                  <td>{formatNumber(transaction.total, numberFormat)}</td>
                </tr>
              ))}
              {data.recentTransactions.length === 0 && (
                <tr>
                  <td className="items-table-empty" colSpan={4}>
                    No transactions recorded for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Add drawer-specific CSS**

Append to `src/styles/analytics-widgets.css`:

```css
.category-drawer-kpis {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.category-drawer-kpis .analytics-kpi-mini-value {
  overflow-wrap: anywhere;
}
```

- [ ] **Step 3: Verify build**

Run:

```powershell
npm run build
```

Expected: build completes and reports no missing imports from Recharts or `categoryAnalytics.js`.

- [ ] **Step 4: Commit drawer widget**

Run:

```powershell
git add -- src/components/analytics/widgets/CategoryDrilldownDrawer.jsx src/styles/analytics-widgets.css
git commit -m "feat(analytics): add category drilldown drawer"
```

---

## Task 5: Wire Heatmap and Drilldown into Categories Tab

**Files:**
- Modify: `src/components/analytics/CategoriesTab.jsx`

- [ ] **Step 1: Add imports**

In `CategoriesTab.jsx`, add:

```js
import CategoryTimeHeatmap from './widgets/CategoryTimeHeatmap';
import CategoryDrilldownDrawer from './widgets/CategoryDrilldownDrawer';
```

- [ ] **Step 2: Add drill state**

After the existing `selectedCategories` state:

```js
const [drillCategory, setDrillCategory] = useState(null);
```

- [ ] **Step 3: Compute visible category list for widgets**

After `filteredPriorBuckets`, add:

```js
const visibleCategories = selectedCategories.length > 0 ? selectedCategories : categories;
```

- [ ] **Step 4: Close the drawer if the selected category disappears**

Add this import at the top:

```js
import React, { useEffect, useMemo, useState } from 'react';
```

Then add this effect before `toggleCategory`:

```js
useEffect(() => {
  if (!drillCategory) return;
  if (!visibleCategories.includes(drillCategory.category)) {
    setDrillCategory(null);
  }
}, [drillCategory, visibleCategories]);
```

- [ ] **Step 5: Render heatmap after contribution bar**

After `<CategoryContributionBar ... />`, insert:

```jsx
<CategoryTimeHeatmap
  buckets={filteredBuckets}
  categories={visibleCategories}
  timeframeLabel={timeframeLabel}
  numberFormat={numberFormat}
/>
```

- [ ] **Step 6: Pass row click to the breakdown table**

Update the `CategoryBreakdownTable` render:

```jsx
<CategoryBreakdownTable
  rows={breakdown}
  totalCategories={categories.length}
  timeframeLabel={timeframeLabel}
  numberFormat={numberFormat}
  onRowClick={setDrillCategory}
/>
```

- [ ] **Step 7: Render drawer at the bottom of the tab**

Before the closing `</div>` of the tab stack, add:

```jsx
{drillCategory && (
  <CategoryDrilldownDrawer
    category={drillCategory.category}
    breakdownRows={breakdown}
    buckets={filteredBuckets}
    stocks={filteredStocks}
    transactions={transactions}
    timeframe={timeframe}
    numberFormat={numberFormat}
    onClose={() => setDrillCategory(null)}
  />
)}
```

- [ ] **Step 8: Verify build**

Run:

```powershell
npm run build
```

Expected: build completes, with no React import or hook dependency errors.

- [ ] **Step 9: Commit Categories tab wiring**

Run:

```powershell
git add -- src/components/analytics/CategoriesTab.jsx
git commit -m "feat(analytics): wire category heatmap and drilldown"
```

---

## Task 6: Manual Verification and Polish

**Files:**
- Modify only files from Tasks 1-5 if manual verification reveals a concrete issue.

- [ ] **Step 1: Run production build**

Run:

```powershell
npm run build
```

Expected:

```text
vite v...
...built...
```

- [ ] **Step 2: Start dev server**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Desktop browser checks**

At desktop width:

- Open the Analytics page.
- Switch to the Categories tab.
- Confirm the heatmap appears below the contribution bar.
- Hover or focus heatmap cells and confirm the subtitle updates with category, date, and formatted profit.
- Click table headers for `Trades`, `Turnover`, and `Profit`, and confirm sorting changes.
- Click a category row and confirm the drawer opens.
- Confirm drawer KPIs show finite values; turnover must be `-` or a percent, never `Infinity` or `NaN`.
- Close the drawer using the close button.
- Reopen the drawer and close it by clicking the overlay.
- Select a category filter and confirm table, heatmap, and drawer data reflect the filtered category set.

- [ ] **Step 4: Mobile browser checks**

At a mobile width around 390px:

- Confirm category filter pills wrap without overlapping.
- Confirm the heatmap scrolls horizontally.
- Confirm category row text and table values do not overlap.
- Confirm the drawer fills the available width and its KPI values wrap cleanly.

- [ ] **Step 5: Fix only concrete verification issues**

If verification finds clipping or overlap in the drawer KPI grid, use this CSS adjustment:

```css
@media (max-width: 640px) {
  .category-drawer-kpis {
    grid-template-columns: 1fr;
  }
}
```

If verification finds the heatmap too compressed on desktop, change the heatmap SVG min width:

```css
.category-time-heatmap-svg {
  min-width: 58rem;
}
```

After any fix, rerun:

```powershell
npm run build
```

- [ ] **Step 6: Commit verification fixes if any**

If Step 5 changed files, run:

```powershell
git add -- src
git commit -m "fix(analytics): polish category enhancement layout"
```

If Step 5 changed nothing, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Per-category drill panel: Task 4 creates the drawer; Task 5 wires row clicks.
- Velocity / turnover column: Task 1 computes `turnoverPct`; Task 2 renders and sorts it.
- Trades count in category breakdown: Task 1 computes `tradesWindow`; Task 2 renders and sorts it.
- Category by time heatmap: Task 3 creates the widget; Task 5 renders it with filtered buckets/categories.
- No migrations: no database files are touched.
- No tests: verification uses `npm run build` and manual checks only.
- No inline CSS: new styling goes into `src/styles/analytics-widgets.css`.

Placeholder scan:

- The plan contains no unresolved placeholder markers or unspecified "add appropriate" steps.
- Every code-changing task names exact files and gives concrete code or exact edit locations.

Type consistency:

- `tradesWindow`, `avgInventoryWindow`, and `turnoverPct` are introduced in `emptyCategoryRow`, populated in helper code, used by `CategoryBreakdownTable`, and displayed by `CategoryDrilldownDrawer`.
- `buildCategoryHeatmapRows` is exported by `categoryAnalytics.js` and imported by `CategoryTimeHeatmap.jsx`.
- `buildCategoryDrilldownData` is exported by `categoryAnalytics.js` and imported by `CategoryDrilldownDrawer.jsx`.
