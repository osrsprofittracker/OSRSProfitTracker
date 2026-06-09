# Non-GE Tracker Design

## Goal

Add a dedicated Non-GE tracking surface for tradeable Old School RuneScape items that do not use Grand Exchange price logic. Non-GE trades should contribute to realized trading history, profit summaries, and milestones, while GE-only features such as live prices, timers, limits, alerts, graph links, and calculators stay out of the Non-GE workflow.

## Product Shape

Add a top-level `Non-GE` page next to the existing Trade page. This page uses familiar trading actions but has its own categories, catalog, archive, and table columns.

The Non-GE table shows:

- Name with image
- Held Qty
- Total Cost
- Avg Buy
- Qty Sold
- Total Sold Price
- Avg Sell
- Profit
- Range
- Target Buy
- Target Sell
- Notes
- Actions

The actions are Buy, Sell, Remove, Adjust, Notes, Archive, and Delete. The Calc action is excluded. GE-specific columns and behavior are excluded: GE High, GE Low, unrealized GE profit, 4h limit, timers, price alerts, graph links, and live GE pricing.

The page header should show summary stats for Non-GE holdings and realized Non-GE profit, plus the active catalog source/version where useful.

## Catalog

The fixed catalog lives in app code as versioned data, not Supabase. The first catalog contains collector-style Non-GE items, including burnt foods, ruined foods, crushed gem, shells, dung, buckets, handeggs/spookies, sailing fish/crabs, and other known Non-GE collector items.

Items from the provided RS Burnt screenshot use the screenshot ranges and source metadata. Larger catalog items without approved RS Burnt ranges show `Unknown`.

Each fixed catalog entry includes:

- stable `key`
- `name`
- default category
- `wikiUrl`
- `imageUrl` or image lookup data
- `rangeLow`
- `rangeHigh`
- `rangeLabel`
- `previousRangeLabel`, initially `No data`
- `trend`, when known: up, down, no-change, new, or caution
- `sourceName`
- `sourceDate`
- F2P/P2P or members classification when known

The displayed Range column shows the current range or `Unknown`. Future catalog updates can show the prior value, for example `70-100 from 80-120`. Initial entries use `previousRangeLabel: 'No data'`.

## Custom Items

Users can create private custom Non-GE catalog items when the fixed catalog misses something. Custom items are scoped to the current user.

Custom item fields:

- name
- optional wiki URL
- optional image URL
- range label, default `Unknown`
- source name, default `Custom`

Custom items behave like fixed catalog items for tracking, but they do not receive automatic RS Burnt catalog range updates unless they are later matched to a fixed catalog entry.

## Add And Bulk Add

`Add Item` opens a modal that follows the current Trade page add-stock pattern, adapted for Non-GE:

- search fixed catalog and private custom items
- select one item
- choose Non-GE category
- optionally enter Target Buy and Target Sell
- add the row with zero held qty and zero total cost

The add modal does not collect initial held qty or total cost. Users establish quantities through Buy, Sell, and Remove after the item exists.

`Bulk Add` opens a catalog picker with search, category filters, and multi-select. Bulk add creates zero-qty rows and skips or warns for already tracked items.

## Categories And Archive

Non-GE categories are separate from existing GE trade and investment categories. Suggested defaults are Commons, F2P, P2P, Non-GE, P2P Sailing, and Uncategorized, but users can manage their own category names and order.

Non-GE archive is in scope. Archived Non-GE stocks are hidden from the main Non-GE page and can be restored from a Non-GE archive modal.

## Database Design

Add these Supabase tables:

`public.non_ge_categories`

- `id`
- `user_id`
- `name`
- `position`
- `created_at`
- `updated_at`

`public.non_ge_custom_items`

- `id`
- `user_id`
- `name`
- `wiki_url`
- `image_url`
- `source_name`
- `range_label`
- `created_at`
- `updated_at`

`public.non_ge_stocks`

- `id`
- `user_id`
- `catalog_item_key`
- `custom_item_id`
- `name_snapshot`
- `category_id`
- `shares`
- `total_cost`
- `shares_sold`
- `total_cost_sold`
- `total_cost_basis_sold`
- `target_buy_price`
- `target_sell_price`
- `notes`
- `position`
- `archived`
- `created_at`
- `updated_at`

Add columns to existing tables:

`public.transactions`

- `market text not null default 'ge'`
- `non_ge_stock_id uuid null`

`public.profit_history`

- `market text not null default 'ge'`
- `non_ge_stock_id uuid null`

All new frontend-accessed tables need Supabase Data API grants, RLS enabled, and authenticated user-owned policies. No migration files should be added; provide manual SQL for the Supabase SQL Editor.

## Unified History

History defaults to all markets. Add Market filter buttons:

- All
- GE
- Non-GE

Keep one unified `transactions` table and update `transactions_view` to normalize GE and Non-GE rows. GE rows use `stock_id`; Non-GE rows use `non_ge_stock_id`. The view returns market, item name, category, type, qty, price, total, profit, margin, and date in a shared shape.

Non-GE buy/sell/remove transactions appear in the existing History page. Undo must use `market` to decide whether to revert `stocks` or `non_ge_stocks`.

Non-GE sell profits also write to `profit_history` with `market = 'non_ge'`, so all-market realized profit, milestones, and summaries can include them while future GE-only filters remain possible.

## GE To Non-GE Move

Users can move an existing GE stock into Non-GE. The move requires selecting a fixed catalog item or private custom item and selecting a Non-GE category.

The confirmation modal shows:

- source GE stock
- destination Non-GE item
- held qty
- sold qty
- total cost
- realized profit
- note status
- affected transaction count
- warning that the original GE stock row will be deleted after history is moved

The move preserves:

- name snapshot
- held qty
- total cost
- sold qty
- total sold value
- sold cost basis
- notes
- transactions and profit history, relinked to Non-GE

The move drops or ignores GE-only data:

- `item_id`
- 4h limit
- timer end time
- price alerts
- graph favorites and recents

The move operation should be atomic where possible. The intended sequence is:

1. Create the `non_ge_stocks` row.
2. Move notes into the Non-GE row.
3. Update `transactions` to `market = 'non_ge'` and set `non_ge_stock_id`.
4. Update `profit_history` to `market = 'non_ge'` and set `non_ge_stock_id`.
5. Delete GE-only linked records such as price alerts and graph preferences if present.
6. Delete the old `stocks` row.

Deleting the old GE stock row prevents duplicate restore paths and double-counted profit.

## Non-GE Trade Behavior

Buy increases held qty and total cost.

Sell decreases held qty, increases sold qty, increases total sold price, and records sold cost basis for realized profit.

Remove decreases held qty and cost basis using the existing Trade page remove behavior adapted to Non-GE.

Adjust follows the existing Trade page adjust concept, adapted to Non-GE metadata only. It can update fields such as category, target buy, target sell, and catalog/custom identity if needed. Buy, Sell, and Remove remain responsible for changing trade quantities and cost/sold totals.

Notes are edited from the Non-GE row and stored on `non_ge_stocks.notes`.

## Catalog Updates

When a new RS Burnt picture or approved catalog update is provided, update the versioned catalog data file and source metadata. Existing user holdings automatically display the new range/source because they reference catalog keys.

User-owned fields are not modified by catalog updates:

- held qty
- total cost
- sold totals
- target prices
- notes
- category

Custom items remain `Unknown` unless manually edited or later matched to a fixed catalog entry.

## Error Handling

Add and bulk add should warn or skip duplicate active holdings.

Move should fail before deleting the GE stock row if any relink step fails. If atomic RPC is not used, the UI should report failure and avoid partial deletion.

Missing image URLs should fall back to the existing item icon fallback pattern.

Rows with deleted or unavailable custom item metadata should continue rendering from `name_snapshot`.

The frontend can render an empty/error state if the required SQL has not been applied, but the feature requires the manual SQL setup before normal use.

## Out Of Scope For First Version

- Admin-managed shared catalog editor
- Automated image parsing from RS Burnt screenshots
- Multiple buy/sell target orders per item
- User-overridden catalog ranges
- GE price alerts or graph pages for Non-GE
- Automated tests, unless explicitly requested
