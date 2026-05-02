# Analytics Page — Design Spec

**Date:** 2026-05-02
**Issue:** [#14 — Create a Page for Analytics](https://github.com/osrsprofittracker/OSRSProfitTracker/issues/14)
**Branch:** `feat/analytics-page`

## Context

OSRS Profit Tracker currently surfaces portfolio metrics across three places:

1. **HomePage** — summary cards (profit, GP traded, inventory), top 10 items, recent activity, goals, watchlist opportunities.
2. **ChartButtons (in MainApp)** — opens two pie-chart modals: `ProfitChartModal` (profit sources) and `CategoryChartModal` (category breakdown).
3. **GraphsPage** — per-item GE price charts (unrelated to portfolio analytics).

There is no time-series view of portfolio profit, no full sortable item leaderboard, and category insights are buried in a modal. Issue #14 asks for a dedicated analytics page. The user wants a deep, dashboard-style page that becomes the canonical place for portfolio insights; HomePage stays small and remains the lightweight overview.

## Decisions

- **Framing:** dedicated dashboard page. HomePage stays as is and keeps its summary cards, top-10 items, and goals — the analytics page goes deeper without replacing those.
- **Layout:** KPI band always visible above tabs. Four tabs: **Profit / Items / Categories / Goals**.
- **Existing modals are deleted:** `ProfitChartModal`, `CategoryChartModal`, `ChartButtons`. Their content is absorbed into the analytics page (with richer time-series). The unrelated **Alt Account Timer** inside `ChartButtons` is relocated to a small toolbar on the trade page header.
- **Timeframe selector:** global, top of page. Windows: `1W / 1M / 3M / 6M / 1Y / All`. Bucket size derived from window: `≤90d → day`, `≤1Y → week`, `else → month`. Selection persisted to `localStorage` per user.
- **Per-chart timeframe override:** out of scope for v1. Captured as v2 idea.
- **Data layer:** Supabase RPC for aggregations + client-side fallback aggregator. No new tables, no scheduled snapshots.
- **Charting library:** `recharts` (~95 KB gzipped) added as a new dep. Used for line/area/stacked area/bar/treemap/sparkline. Heatmap rendered as raw SVG grid. `lightweight-charts` stays in use for `GraphsPage` only.
- **Routing:** new `/analytics` route, nav button added between Graphs and Watchlist. `?tab=profit|items|categories|goals` deep-links supported.

## Architecture

### New Supabase RPC

```sql
get_analytics_buckets(
  p_user_id   uuid,
  p_start     date,
  p_end       date,
  p_bucket    text   -- 'day' | 'week' | 'month'
)
returns table(
  bucket_date     date,
  profit_items    bigint,    -- sells: total_cost_sold - total_cost_basis_sold
  profit_dump     bigint,
  profit_referral bigint,
  profit_bonds    bigint,
  gp_traded       bigint,    -- sum of transactions.total in the bucket
  by_category     jsonb,     -- {category_name: profit, ...} from sells joined to stocks
  sells_count     int,
  wins_count      int        -- sells with profit > 0
);
```

Implementation: union of (a) sell transactions joined to stocks for category and basis, computing realized profit per bucket, and (b) `profit_history` rows with `profit_type IN ('dump','referral','bonds')` bucketed by `created_at`. `gp_traded` is `sum(transactions.total)` (buys + sells) bucketed by `date`.

`p_bucket` selects the `date_trunc(...)` granularity. RLS-aware: function uses `auth.uid()` check or accepts `p_user_id` and validates against `auth.uid()`.

### New hook: `useAnalytics`

`src/hooks/useAnalytics.js`

Inputs: `{ userId, start, end, bucket }`.
Outputs: `{ buckets, loading, error, fromFallback, refetch }`.

- Memoized cache keyed by `${userId}-${start}-${end}-${bucket}`.
- Calls the RPC. On error, computes the same shape from existing in-memory data (`transactions`, `profitHistory`, `stocks`) and sets `fromFallback: true`. The page renders normally with a small banner indicating fallback mode.

### New hook: `useAnalyticsTimeframe`

`src/hooks/useAnalyticsTimeframe.js`

- Holds `{ window, start, end, bucket }`.
- Window options: `1W / 1M / 3M / 6M / 1Y / All`. `All` start = first transaction date (queried once).
- Bucket derivation: `1W|1M|3M → day`, `6M|1Y → week`, `All → month`.
- Persists `window` to `localStorage` as `analyticsTimeframe_${userId}`.

### File layout

```
src/pages/AnalyticsPage.jsx                  // shell, KPI band, tab nav, timeframe selector
src/hooks/useAnalytics.js                    // RPC wrapper + fallback aggregator
src/hooks/useAnalyticsTimeframe.js           // window/bucket state, persisted

src/components/analytics/
  KpiBand.jsx
  TabNav.jsx
  TimeframeSelector.jsx
  ProfitTab.jsx
  ItemsTab.jsx
  CategoriesTab.jsx
  GoalsTab.jsx
  widgets/
    ProfitOverTimeChart.jsx
    CumulativeProfitChart.jsx
    ProfitBySourceChart.jsx
    GpTradedChart.jsx
    PeriodComparisonCards.jsx
    BestWorstDaysTable.jsx
    ProfitKpiStrip.jsx
    ProfitHeatmap.jsx
    ItemsTable.jsx
    ItemsFilterBar.jsx
    ItemDrilldownDrawer.jsx
    MoversList.jsx
    BuyingVsSellingChart.jsx
    StaleInventoryTable.jsx
    RoiHistogram.jsx
    ExportCsvButton.jsx
    CategoryStackedAreaChart.jsx
    CategoryBreakdownTable.jsx
    CategoryShareDonut.jsx
    CategoryPeriodComparison.jsx
    CategoryContributionBar.jsx
    CategoryMarginChart.jsx
    InventoryTreemap.jsx
    GoalHitRateChart.jsx
    StreakCounter.jsx
    MilestoneHistoryTable.jsx
    ProfitVsGoalChart.jsx
    TimeToGoalEstimator.jsx
    AvgVsGoalKpis.jsx

src/styles/analytics-page.css
src/styles/analytics-widgets.css
```

### Cleanup

In the same PR:

- Delete `src/components/modals/ProfitChartModal.jsx`.
- Delete `src/components/modals/CategoryChartModal.jsx`.
- Delete `src/components/ChartButtons.jsx`.
- Remove their imports, modal handlers, and renders from `MainApp.jsx`, `useModalHandlers.js`, `ModalManager.jsx`, `ModalContext.jsx`.
- Move the **Alt Account Timer** UI (currently inside `ChartButtons`) into a new small component on the trade page header so the feature is preserved.

### Routing & navigation

- Add `'analytics'` to the `navigateToPage` page list in `MainApp.jsx`.
- Add a new nav button between Graphs and Watchlist (matching existing button styling around lines 967–1010 of `MainApp.jsx`).
- URL: `/analytics`. Tab deep-link: `/analytics?tab=items` etc.

## Page structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Header:  "Analytics"          [1W][1M][3M][6M][1Y][All]         │
├─────────────────────────────────────────────────────────────────┤
│ KPI Band — 4 cards (2x2 on mobile)                              │
│  • Total Profit (all-time, no delta)                            │
│  • Period Profit (window value + delta vs prior window)         │
│  • GP Traded (period) (window value + delta vs prior window)    │
│  • Inventory Value (current) (delta vs window-start snapshot)   │
├─────────────────────────────────────────────────────────────────┤
│ Tab nav:  [Profit] [Items] [Categories] [Goals]                 │
├─────────────────────────────────────────────────────────────────┤
│ Active tab content                                              │
└─────────────────────────────────────────────────────────────────┘
```

KPI cards reuse `home-page.css` `.summary-card` styling for visual consistency.

Tabs render lazily on first activation, then stay mounted for the rest of the session so sort/filter/drawer state survives tab switches.

## Profit tab

Layout: two-column grid ≥1024px, single column below.

| # | Widget | Span |
|---|---|---|
| 1 | Profit over time (line) | Full width |
| 2 | Cumulative profit (area) — toggle "all-time origin" | Full width |
| 3 | Profit by source (stacked bar) | Half (left) |
| 4 | GP traded (bar) — toggleable transactions-per-bucket overlay | Half (right) |
| 5 | Period comparison — 3 cards (this/last/same-period-last-year) | Full width |
| 6 | Best/worst days — two stacked top-5 tables | Half (left) |
| 7 | KPI strip — avg profit/sell, avg margin %, win rate | Half (right) |
| 8 | Profit heatmap — last 365 days, raw SVG grid | Full width |

**Edge cases:**
- "Same period last year" card shows "Not enough history" if first transaction is < 1 year ago.
- Cumulative chart resets to 0 at window start unless toggle is on.
- Heatmap is fixed at 365 days regardless of timeframe selector.

## Items tab

| # | Widget | Notes |
|---|---|---|
| 1 | Full sortable items table | Defaults to non-archived stocks. Virtualized at >100 rows. Same sort options as HomePage Top Items + additions: `daysHeld`, `roiPct`, `gpTraded`. Includes archived rows when the filter-bar archived toggle is on. |
| 2 | Filter bar | Category multiselect, has-stock-only, sold-in-window-only, archived toggle. Filters drive the table and the movers list. |
| 3 | Item drilldown drawer | Opened by row click. Shows item profit history, GE price overlay, transactions for that item. Reuses `useTimeseries` and existing transaction data. |
| 4 | Movers list | Top 5 gainers + top 5 losers in the window. Uses bucket data from `useAnalytics` projected per item. |
| 5 | Buying vs selling activity chart | Per-item net direction in window (bar chart). |
| 6 | Stale inventory table | Items held > 30 days without a sale, sortable by capital tied up. Threshold configurable via dropdown (7/30/90/180 days). |
| 7 | ROI distribution histogram | Bins: <0%, 0-5%, 5-10%, 10-20%, 20-50%, >50%. Shows item count per band. |
| 8 | Export CSV button | Exports the currently-filtered table view. |

## Categories tab

| # | Widget | Notes |
|---|---|---|
| 1 | Category profit over time (stacked area) | Per-category profit by bucket. |
| 2 | Category breakdown table | Sortable: profit, GP traded, inventory value, # unique items, avg margin %. |
| 3 | Category share donut | Multi-metric switcher matching deleted `CategoryChartModal`: cost / quantity / profit / sold cost / sold quantity. Snapshot, current state. |
| 4 | Category period comparison | Per-category delta this period vs last period of same length. Highlights biggest movers. |
| 5 | Category contribution bar | Single horizontal stacked bar: % of window total profit per category. |
| 6 | Category margin chart | Avg margin % per category (bar chart). |
| 7 | Inventory treemap | Capital tied up per category right now. Recharts `Treemap`. |

## Goals tab

| # | Widget | Notes |
|---|---|---|
| 1 | Goal hit-rate over time | % of buckets where profit ≥ goal in the window. |
| 2 | Streak counter | Current and longest streak hitting daily/weekly goals. |
| 3 | Milestone history table | All milestone changes with timestamps. Sources from existing `useMilestones`. |
| 4 | Profit vs goal chart | Profit line with goal line overlay across the window. |
| 5 | Time-to-goal estimator | Days/weeks until monthly/yearly goal at current pace. |
| 6 | Avg vs goal KPIs | Avg daily/weekly profit vs current goal, with delta %. |

## Empty / loading / error states

- **No transactions:** each tab shows a friendly empty state with a "Go to Trade" button.
- **No data in window:** each chart shows "No activity in this window. Switch to a wider timeframe." with a one-click "Set to All" button.
- **Loading:** skeleton placeholders on KPI cards + a spinner on the active tab area.
- **RPC error:** non-blocking banner at top of tab "Showing locally-computed data" + render via fallback aggregator.

## Mobile responsiveness

- Page padding tightens at `<640px`.
- KPI cards: 2x2 grid.
- Tab nav: horizontal scroll if labels overflow.
- Timeframe selector: pill row wraps to second line if needed.
- Profit-tab two-column widgets collapse to full width.
- Items table: horizontal scroll inside a fixed-height container; sticky first column (item name).

## Testing

- **Unit tests:** `useAnalyticsTimeframe` bucket derivation, `useAnalytics` cache key behavior, fallback aggregator output shape matches RPC output shape against a small in-memory fixture.
- **Integration test:** seed Supabase test schema with N transactions + profit_history + stocks, call the RPC, compare to client-fallback aggregator. Diff = 0 across every field.
- **Snapshot tests** for each widget against fixed input data.
- **Manual checklist** in PR description: visit `/analytics`, switch all 4 tabs, switch all 6 timeframes, hover all charts for tooltips, click best/worst day to navigate to history, open and close item drilldown drawer, export CSV, resize to mobile width.

## Open questions

- **Per-chart timeframe override.** Skipped for v1. If the user comes back wanting it, plan a small extension to `useAnalyticsTimeframe` that accepts a chart-id key.
- **Inventory snapshot for KPI delta.** Computing "inventory value at window start" from transactions backwards is correct but requires walking the full ledger. Consider caching most-recent computation if it shows up as slow.

## Out of scope (v2 candidates)

- Per-chart timeframe override.
- User-customizable widget order / dashboard editor.
- Goal calendar grid (overlap with Profit-tab heatmap).
- Realized vs unrealized profit dual line.
- Win rate KPI in the band.
- Category drilldown to item list (overlap with Items tab + filter).
- Sparkline column in items table.
- Materialized daily snapshots / scheduled aggregations.
