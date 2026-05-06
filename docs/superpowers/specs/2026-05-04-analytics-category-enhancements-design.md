# Analytics Category Enhancements - Design Spec

**Date:** 2026-05-04
**Scope:** Categories tab on the Analytics page

## Context

The Analytics page already has a Categories tab with category filters, stacked category profit, contribution, category share, margin, breakdown, period comparison, and inventory treemap widgets. The current implementation uses:

- `src/components/analytics/CategoriesTab.jsx` for tab composition and category filtering.
- `src/utils/categoryAnalytics.js` for category aggregation from `buckets`, `stocks`, `transactions`, `profitHistory`, and live GE prices.
- `src/components/analytics/widgets/CategoryBreakdownTable.jsx` for the sortable category table.
- `src/components/analytics/widgets/ItemDrilldownDrawer.jsx` and `src/styles/analytics-items.css` as the existing drilldown pattern to mirror.

The requested additions are:

- Per-category drill panel, matching the existing item drilldown behavior.
- Velocity / turnover column: selected-window profit divided by average inventory tied up over that same selected window.
- Trades count in the category breakdown for the selected timeframe.
- Category by time heatmap: rows are categories, columns are bucket dates, cell color is profit.

No database migration files will be added. The implementation stays client-side and uses existing data already available to the Analytics page.

## Decisions

- **Drilldown UX:** clicking a row in the category breakdown opens a right-side drawer, matching the item drilldown pattern. The table layout remains stable.
- **Turnover definition:** `windowProfit / avgInventoryTiedUpOverWindow`, displayed as a percentage. Average inventory is computed by simulating category inventory over the selected window from transactions and stock balances rather than using only the current `stocks.totalCost` snapshot.
- **Trades count:** count buy and sell transactions in the selected timeframe for the category. Adjustment rows are excluded unless the existing transaction data treats them as buy or sell.
- **Heatmap source:** `bucket.by_category`, filtered by the active category pills and selected timeframe. Positive profit uses green intensity, negative profit uses red intensity, and zero uses muted slate.
- **Implementation source:** extend `src/utils/categoryAnalytics.js` and existing category widgets. Do not add tests, test runners, or test dependencies.

## Architecture

### Category metric helpers

Extend `categoryAnalytics.js` with helpers that can be used by the table, drawer, and heatmap:

- `computeCategoryBreakdown(...)` gains:
  - `tradesWindow`
  - `avgInventoryWindow`
  - `turnoverPct`
- A new helper builds per-category daily or bucket-level inventory exposure from existing stock and transaction data.
- A new helper builds heatmap rows from `buckets`:
  - `{ category, cells: [{ date, profit }] }`
- A new helper builds drawer data:
  - selected category metrics
  - profit series from `buckets`
  - stocks/items in the category
  - recent buy/sell transactions in the category

### Average inventory algorithm

The implementation should avoid relying on current inventory alone.

1. Build stock lookup by `stock.id`.
2. Walk transactions in chronological order.
3. Maintain per-stock held shares and held cost using average-cost logic:
   - Buy increases shares and cost by transaction `shares` and `total`.
   - Sell reduces shares and cost by estimated sold cost basis.
4. For each date in the selected window, sum held cost by category.
5. Average the daily category totals across the selected window.

If transaction history is incomplete for a stock, use the best available reconstruction and keep the tooltip explicit that the value is estimated from loaded transactions and current stock data. Categories with no average inventory tied up show turnover as `0%` when profit is also zero, and `-` when profit exists but the denominator is zero.

### Category breakdown table

Add two sortable columns:

- `Trades (<timeframe>)`: selected-window buy/sell transaction count.
- `Turnover (<timeframe>)`: selected-window profit divided by average inventory tied up over the same window.

The table row should become clickable. Clicking a category row calls `onRowClick(row)` and opens the drilldown drawer. Empty rows and pager controls should not open the drawer.

### Category drilldown drawer

Create `src/components/analytics/widgets/CategoryDrilldownDrawer.jsx`.

The drawer mirrors `ItemDrilldownDrawer` structure and classes where practical:

- Header: category name and selected timeframe.
- KPI grid:
  - Profit in window
  - Trades in window
  - Avg inventory tied up
  - Turnover
  - Current inventory
  - Unrealized profit
- Profit trend chart:
  - Uses category values from `bucket.by_category`.
  - Draws a zero reference line.
- Top items:
  - Items in this category sorted by window GP traded or total realized profit.
- Recent transactions:
  - Most recent buy/sell transactions for stocks in this category.

The drawer should close on overlay click and close button, use the existing fixed right-side drawer visual pattern, and remain keyboard accessible through the same dialog semantics used by item drilldown.

### Category time heatmap

Create `src/components/analytics/widgets/CategoryTimeHeatmap.jsx`.

Behavior:

- Rows: category names after active category filtering.
- Columns: `bucket.bucket_date` values in the selected timeframe.
- Cell value: `bucket.by_category[category] || 0`.
- Cell color:
  - zero: muted slate
  - positive: green intensity based on positive quantiles
  - negative: red intensity based on absolute negative quantiles
- Hover/focus subtitle shows category, date, and formatted profit.
- Cells should be focusable and have accessible labels.

Layout:

- Use an SVG grid with horizontal scrolling, consistent with `ProfitHeatmap`.
- Keep row labels readable with a fixed label column or left text area in the SVG.
- On mobile, horizontal scroll is acceptable.

## Component Flow

`AnalyticsPage.jsx` already passes these props into `CategoriesTab`:

- `buckets`
- `priorBuckets`
- `stocks`
- `transactions`
- `profitHistory`
- `timeframe`
- `numberFormat`

`CategoriesTab.jsx` will:

1. Keep current category filter behavior.
2. Compute filtered stocks and filtered buckets.
3. Compute category breakdown with transaction-aware metrics.
4. Hold `drillCategory` state.
5. Pass `onRowClick={setDrillCategory}` to `CategoryBreakdownTable`.
6. Render `CategoryTimeHeatmap` with filtered buckets and visible categories.
7. Render `CategoryDrilldownDrawer` when a category is selected.

## Error and Empty States

- If no categories exist, category widgets keep their current empty-state behavior.
- If a category has no trades in the selected timeframe, trades show `0`, profit shows `0`, and turnover shows `0%` unless there is profit with no denominator.
- If heatmap has no category/date data, show "No category profit in this window."
- If a selected category is filtered away, close the drawer or update it to the matching filtered dataset.

## Styling

- No inline CSS.
- Reuse existing `.items-drawer*`, `.analytics-kpi-mini`, `.items-table*`, `.analytics-heatmap*`, and `.has-tooltip` classes where they fit.
- Add only scoped category heatmap and drawer styles to `src/styles/analytics-widgets.css` or an existing relevant analytics stylesheet.
- Keep modal/drawer colors aligned with the current analytics palette.

## Verification

No automated tests will be added.

Manual verification:

- Build succeeds with `npm run build`.
- Categories tab renders with the new heatmap.
- Category table sorts by Trades and Turnover.
- Clicking a category row opens the drawer.
- Drawer closes via overlay and close button.
- Turnover handles zero inventory without `Infinity` or `NaN`.
- Category filters affect the table, heatmap, and drawer data consistently.
- Desktop and mobile layouts do not overlap or clip visible text.

## Out of Scope

- Supabase RPC or schema changes.
- Database migration files.
- CSV export for category analytics.
- Customizable heatmap color palettes.
- Drilldown navigation from heatmap cells to History.
