# Non-GE Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Non-GE tracker with fixed catalog data, private custom items, Non-GE categories/archive, unified all-market history, and GE-to-Non-GE move support.

**Architecture:** Keep Non-GE holdings separate from GE stocks with `non_ge_*` tables and hooks, while using the existing `transactions` and `profit_history` tables with an explicit `market` field for unified history. Ship the fixed catalog as versioned frontend data so catalog updates are code/content changes, not user data mutations.

**Tech Stack:** React 18, Vite, Supabase browser client, PostgreSQL/RLS SQL applied manually in Supabase SQL Editor, lucide-react, existing CSS files in `src/styles/`.

---

## Execution Strategy

Implement this across separate chats or PRs. Do not attempt the whole feature in one run.

1. Database SQL and view/RPC setup.
2. Catalog data and helpers.
3. Non-GE hooks and context.
4. Non-GE page read/add/bulk/archive.
5. Non-GE trade actions.
6. Unified History market support.
7. GE-to-Non-GE move workflow.

At the start of a new chat, paste the current task number and link this plan. Keep commits small and scoped to each task. Do not add automated tests, test files, test runners, or test dependencies unless the user explicitly requests them.

## Shared Verification Commands

Use these after code changes:

```powershell
npm run build
```

Expected: Vite build completes without errors.

For UI tasks, also run the dev server:

```powershell
npm run dev
```

Expected: Vite prints a local URL. Open that URL and manually verify the task-specific checklist.

---

### Task 1: Manual Supabase SQL Setup Document

**Files:**
- Create: `docs/non-ge-supabase-setup.sql`
- No frontend code changes in this task.

**Purpose:** Provide the SQL the user applies manually in Supabase SQL Editor. This repo does not use migration files.

- [ ] **Step 1: Create `docs/non-ge-supabase-setup.sql`**

Add a SQL file with sections for new tables, grants, RLS, altered existing tables, indexes, and the view-definition inspection note. Use this file as the source the user applies manually.

```sql
-- Non-GE tracker setup.
-- Apply manually in the Supabase SQL Editor.

create table if not exists public.non_ge_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.non_ge_custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wiki_url text,
  image_url text,
  source_name text not null default 'Custom',
  range_label text not null default 'Unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lower(name))
);

create table if not exists public.non_ge_stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_key text,
  custom_item_id uuid references public.non_ge_custom_items(id) on delete set null,
  name_snapshot text not null,
  category_id uuid references public.non_ge_categories(id) on delete set null,
  shares numeric not null default 0,
  total_cost numeric not null default 0,
  shares_sold numeric not null default 0,
  total_cost_sold numeric not null default 0,
  total_cost_basis_sold numeric not null default 0,
  target_buy_price numeric,
  target_sell_price numeric,
  notes text,
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (catalog_item_key is not null and custom_item_id is null)
    or (catalog_item_key is null and custom_item_id is not null)
  )
);

alter table public.transactions
  add column if not exists market text not null default 'ge',
  add column if not exists non_ge_stock_id uuid references public.non_ge_stocks(id) on delete set null;

alter table public.profit_history
  add column if not exists market text not null default 'ge',
  add column if not exists non_ge_stock_id uuid references public.non_ge_stocks(id) on delete set null;

alter table public.transactions
  add constraint transactions_market_check
  check (market in ('ge', 'non_ge'))
  not valid;

alter table public.transactions
  validate constraint transactions_market_check;

alter table public.profit_history
  add constraint profit_history_market_check
  check (market in ('ge', 'non_ge'))
  not valid;

alter table public.profit_history
  validate constraint profit_history_market_check;

create index if not exists idx_non_ge_categories_user_position
  on public.non_ge_categories(user_id, position);

create index if not exists idx_non_ge_custom_items_user_name
  on public.non_ge_custom_items(user_id, name);

create index if not exists idx_non_ge_stocks_user_archived_position
  on public.non_ge_stocks(user_id, archived, position);

create index if not exists idx_transactions_market_user_date
  on public.transactions(user_id, market, date desc);

create index if not exists idx_transactions_non_ge_stock_id
  on public.transactions(non_ge_stock_id);

create index if not exists idx_profit_history_market_user_created
  on public.profit_history(user_id, market, created_at desc);

grant select, insert, update, delete
on table public.non_ge_categories
to authenticated;

grant select, insert, update, delete
on table public.non_ge_custom_items
to authenticated;

grant select, insert, update, delete
on table public.non_ge_stocks
to authenticated;

alter table public.non_ge_categories enable row level security;
alter table public.non_ge_custom_items enable row level security;
alter table public.non_ge_stocks enable row level security;

drop policy if exists "Users can manage their own non-ge categories"
on public.non_ge_categories;

create policy "Users can manage their own non-ge categories"
on public.non_ge_categories
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own non-ge custom items"
on public.non_ge_custom_items;

create policy "Users can manage their own non-ge custom items"
on public.non_ge_custom_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own non-ge stocks"
on public.non_ge_stocks;

create policy "Users can manage their own non-ge stocks"
on public.non_ge_stocks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Before replacing transactions_view, inspect the current definition:
-- select pg_get_viewdef('public.transactions_view'::regclass, true);
--
-- Then replace it with the same existing GE columns plus:
-- market,
-- non_ge_stock_id,
-- stock_name resolved from non_ge_stocks.name_snapshot when market = 'non_ge',
-- category resolved from non_ge_categories.name when market = 'non_ge'.
--
-- Keep the existing profit and margin formulas intact for GE rows.
-- Apply the same formulas to Non-GE rows using non_ge_stocks.total_cost_basis_sold.
```

- [ ] **Step 2: Add a note below the SQL about the view definition**

At the end of the SQL file, document that the exact `transactions_view` replacement must preserve the current production view definition. The worker must fetch the current view SQL from Supabase before writing the final replacement because the local repo does not contain the authoritative view definition.

- [ ] **Step 3: Verify the SQL file is not a migration**

Run:

```powershell
git status --short
```

Expected: `docs/non-ge-supabase-setup.sql` appears as an untracked or modified documentation/setup file, not under a migration directory.

- [ ] **Step 4: Commit Task 1**

```powershell
git add docs/non-ge-supabase-setup.sql
git commit -m "docs: add non-ge supabase setup sql"
```

---

### Task 2: Fixed Non-GE Catalog Data And Helpers

**Files:**
- Create: `src/data/nonGeCatalog.js`
- Create: `src/utils/nonGeCatalog.js`

**Purpose:** Add a versioned in-app catalog and search helpers independent from Supabase.

- [ ] **Step 1: Create catalog data**

Create `src/data/nonGeCatalog.js` with this shape:

```js
export const NON_GE_CATALOG_VERSION = {
  sourceName: 'RS Burnt',
  sourceDate: 'March 2026',
  label: 'RS Burnt March 2026',
};

export const NON_GE_DEFAULT_CATEGORIES = [
  'Commons',
  'F2P',
  'P2P',
  'Non-GE',
  'P2P Sailing',
  'Uncategorized',
];

export const NON_GE_CATALOG = [
  {
    key: 'bass-tung',
    name: 'Bass/Tung',
    category: 'Commons',
    wikiUrl: 'https://oldschool.runescape.wiki/w/Bass',
    imageUrl: '',
    rangeLow: 80,
    rangeHigh: 120,
    rangeLabel: '80-120',
    previousRangeLabel: 'No data',
    trend: 'down',
    sourceName: 'RS Burnt',
    sourceDate: 'March 2026',
    membership: 'f2p',
  },
  {
    key: 'crushed-gem',
    name: 'Crushed gem',
    category: 'Non-GE',
    wikiUrl: 'https://oldschool.runescape.wiki/w/Crushed_gem',
    imageUrl: '',
    rangeLow: 70,
    rangeHigh: 150,
    rangeLabel: '70-150',
    previousRangeLabel: 'No data',
    trend: 'down',
    sourceName: 'RS Burnt',
    sourceDate: 'March 2026',
    membership: 'members',
  },
  {
    key: 'burnt-chicken',
    name: 'Burnt chicken',
    category: 'F2P',
    wikiUrl: 'https://oldschool.runescape.wiki/w/Burnt_chicken',
    imageUrl: '',
    rangeLow: null,
    rangeHigh: null,
    rangeLabel: 'Unknown',
    previousRangeLabel: 'No data',
    trend: 'unknown',
    sourceName: 'OSRS Wiki',
    sourceDate: 'Catalog seed',
    membership: 'f2p',
  },
];
```

Then expand the list with all screenshot items. Add broader collector-style items with `Unknown` ranges when the screenshot does not approve a range. Keep each object complete; do not omit fields.

- [ ] **Step 2: Create helper utilities**

Create `src/utils/nonGeCatalog.js`:

```js
import { NON_GE_CATALOG } from '../data/nonGeCatalog';

export function getNonGECatalogItem(key) {
  if (!key) return null;
  return NON_GE_CATALOG.find(item => item.key === key) || null;
}

export function normalizeNonGESearch(value) {
  return String(value || '').trim().toLowerCase();
}

export function searchNonGECatalog(query, limit = 50) {
  const normalized = normalizeNonGESearch(query);
  const items = normalized
    ? NON_GE_CATALOG.filter(item => item.name.toLowerCase().includes(normalized))
    : NON_GE_CATALOG;
  return items.slice(0, limit);
}

export function nonGEItemDisplayName(stockOrItem) {
  return stockOrItem?.nameSnapshot || stockOrItem?.name || stockOrItem?.name_snapshot || 'Unknown item';
}

export function nonGEItemRangeLabel(item) {
  return item?.rangeLabel || 'Unknown';
}
```

- [ ] **Step 3: Verify build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit Task 2**

```powershell
git add src/data/nonGeCatalog.js src/utils/nonGeCatalog.js
git commit -m "feat: add non-ge catalog data"
```

---

### Task 3: Non-GE Data Hooks

**Files:**
- Create: `src/hooks/useNonGECategories.js`
- Create: `src/hooks/useNonGECustomItems.js`
- Create: `src/hooks/useNonGEStocks.js`
- Create: `src/contexts/NonGEContext.jsx`

**Purpose:** Encapsulate Supabase access for Non-GE user data before building UI.

- [ ] **Step 1: Implement `useNonGECategories`**

Mirror `src/hooks/useCategories.js`, but target `non_ge_categories`. Return:

```js
{
  categories,
  loading,
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  ensureDefaultCategories,
}
```

`ensureDefaultCategories(defaultNames)` inserts missing default names for the user and then refetches.

- [ ] **Step 2: Implement `useNonGECustomItems`**

Target `non_ge_custom_items`. Return:

```js
{
  customItems,
  loading,
  fetchCustomItems,
  addCustomItem,
  updateCustomItem,
  deleteCustomItem,
}
```

Map snake_case rows to camelCase objects: `wikiUrl`, `imageUrl`, `sourceName`, `rangeLabel`.

- [ ] **Step 3: Implement `useNonGEStocks`**

Target `non_ge_stocks`. Return:

```js
{
  stocks,
  allStocks,
  loading,
  addStock,
  updateStock,
  deleteStock,
  archiveStock,
  restoreStock,
  fetchArchivedStocks,
  reorderStocks,
  refetch,
}
```

Map fields to camelCase: `catalogItemKey`, `customItemId`, `nameSnapshot`, `categoryId`, `totalCost`, `sharesSold`, `totalCostSold`, `totalCostBasisSold`, `targetBuyPrice`, `targetSellPrice`.

- [ ] **Step 4: Implement `NonGEContext`**

Create a context similar to `src/contexts/TradeContext.jsx`:

```jsx
import { createContext, useContext, useMemo } from 'react';

const NON_GE_DEFAULT = {
  stocks: [],
  allStocks: [],
  categories: [],
  customItems: [],
  refetchStocks: () => {},
  refetchCategories: () => {},
  refetchCustomItems: () => {},
};

const NonGEContext = createContext(NON_GE_DEFAULT);

export function NonGEProvider({ stocks, allStocks, categories, customItems, refetchStocks, refetchCategories, refetchCustomItems, children }) {
  const value = useMemo(
    () => ({ stocks, allStocks, categories, customItems, refetchStocks, refetchCategories, refetchCustomItems }),
    [stocks, allStocks, categories, customItems, refetchStocks, refetchCategories, refetchCustomItems]
  );

  return <NonGEContext.Provider value={value}>{children}</NonGEContext.Provider>;
}

export function useNonGE() {
  return useContext(NonGEContext);
}
```

- [ ] **Step 5: Verify build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit Task 3**

```powershell
git add src/hooks/useNonGECategories.js src/hooks/useNonGECustomItems.js src/hooks/useNonGEStocks.js src/contexts/NonGEContext.jsx
git commit -m "feat: add non-ge data hooks"
```

---

### Task 4: Non-GE Page, Table, Add, Bulk Add, Archive

**Files:**
- Create: `src/pages/NonGEPage.jsx`
- Create: `src/components/non-ge/NonGETable.jsx`
- Create: `src/components/non-ge/NonGECategorySection.jsx`
- Create: `src/components/modals/NonGEAddItemModal.jsx`
- Create: `src/components/modals/NonGEBulkAddModal.jsx`
- Create: `src/components/modals/NonGEArchiveModal.jsx`
- Create: `src/styles/non-ge-page.css`
- Modify: `src/MainApp.jsx`
- Modify: `src/components/ModalManager.jsx`

**Purpose:** Make the Non-GE page usable for read/add/bulk/archive without trade actions yet.

- [ ] **Step 1: Add navigation state**

In `src/MainApp.jsx`, add a `nonge` page option to the existing navigation buttons. Label it `Non-GE`. Render `<NonGEPage />` when active.

- [ ] **Step 2: Wire hooks into `MainApp`**

Call the new hooks with `userId`. Wrap the app shell with `NonGEProvider` alongside `TradeProvider`.

- [ ] **Step 3: Create `NonGEPage`**

Render:

- page heading
- summary cards for active item count, held qty, total cost, realized profit
- buttons for Add Item, Bulk Add, Archive
- category sections grouped by Non-GE category

- [ ] **Step 4: Create table and category components**

`NonGETable` columns must match the approved design:

- Name with image/fallback
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

Use existing formatter and calculation utilities where possible. Do not include GE price, timer, alert, graph, or Calc controls.

- [ ] **Step 5: Create add modal**

`NonGEAddItemModal` searches fixed catalog and custom items, selects one item, category, target buy, and target sell. It calls `onConfirm` with:

```js
{
  catalogItemKey,
  customItemId,
  nameSnapshot,
  categoryId,
  targetBuyPrice,
  targetSellPrice,
}
```

The handler inserts a zero-qty row.

- [ ] **Step 6: Create bulk add modal**

`NonGEBulkAddModal` shows searchable catalog rows with checkboxes. It inserts zero-qty rows for selected items and warns/skips duplicates.

- [ ] **Step 7: Create archive modal**

`NonGEArchiveModal` lists archived Non-GE stocks and restores them via `restoreStock`.

- [ ] **Step 8: Verify manually**

Run:

```powershell
npm run dev
```

Expected manual checks:

- `Non-GE` nav item opens the new page.
- Add Item creates a zero-qty Non-GE row.
- Bulk Add creates multiple zero-qty rows.
- Archive hides a row.
- Restore brings it back.
- GE Trade page still loads and has its existing controls.

- [ ] **Step 9: Build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 10: Commit Task 4**

```powershell
git add src/MainApp.jsx src/components/ModalManager.jsx src/pages/NonGEPage.jsx src/components/non-ge src/components/modals/NonGEAddItemModal.jsx src/components/modals/NonGEBulkAddModal.jsx src/components/modals/NonGEArchiveModal.jsx src/styles/non-ge-page.css
git commit -m "feat: add non-ge page and catalog add flow"
```

---

### Task 5: Non-GE Buy, Sell, Remove, Adjust, Notes

**Files:**
- Create: `src/hooks/useNonGETradeHandlers.js`
- Create: `src/components/modals/NonGEAdjustModal.jsx`
- Modify: `src/components/non-ge/NonGETable.jsx`
- Modify: `src/pages/NonGEPage.jsx`
- Modify: `src/components/ModalManager.jsx`
- Modify: `src/hooks/useTransactions.js`
- Modify: `src/hooks/useProfitHistory.js`

**Purpose:** Add trade actions and write unified transaction/profit rows.

- [ ] **Step 1: Create Non-GE trade handler hook**

Implement buy/sell/remove handlers based on `src/hooks/useModalHandlers.js`, but target `non_ge_stocks` and write transactions with:

```js
{
  market: 'non_ge',
  nonGeStockId: stock.id,
  stockId: null,
  stockName: stock.nameSnapshot,
  type: 'buy' | 'sell' | 'remove',
  shares,
  price,
  total,
  date: new Date().toISOString(),
}
```

- [ ] **Step 2: Update `addTransaction`**

In `src/hooks/useTransactions.js`, map optional `market` and `nonGeStockId`:

```js
market: transaction.market || 'ge',
non_ge_stock_id: transaction.nonGeStockId || null,
stock_id: transaction.stockId || null,
```

- [ ] **Step 3: Update profit writes**

In `src/hooks/useProfitHistory.js`, allow `market` and `nonGeStockId` so Non-GE sell profits write `market = 'non_ge'`.

- [ ] **Step 4: Add Adjust metadata modal**

`NonGEAdjustModal` can update category, target buy, target sell, and catalog/custom identity. It must not edit held qty, total cost, qty sold, total sold price, or sold cost basis.

- [ ] **Step 5: Add Notes handling**

Use `non_ge_stocks.notes` through `updateStock`. Do not create a separate notes table.

- [ ] **Step 6: Verify manually**

Run:

```powershell
npm run dev
```

Expected manual checks:

- Buy increases held qty and total cost.
- Sell decreases held qty, increases sold qty and total sold price.
- Profit changes after a sell.
- Remove decreases held qty and cost basis.
- Adjust changes only metadata fields.
- Notes save and reload.

- [ ] **Step 7: Build and commit**

```powershell
npm run build
git add src/hooks/useNonGETradeHandlers.js src/components/modals/NonGEAdjustModal.jsx src/components/non-ge/NonGETable.jsx src/pages/NonGEPage.jsx src/components/ModalManager.jsx src/hooks/useTransactions.js src/hooks/useProfitHistory.js
git commit -m "feat: add non-ge trade actions"
```

---

### Task 6: Unified History Market Filter And Undo

**Files:**
- Modify: `src/hooks/useTransactions.js`
- Modify: `src/pages/HistoryPage.jsx`
- Modify: `src/hooks/useNavigation.js`
- Modify: `src/styles/history-page.css`

**Purpose:** Make History default to all markets and filter by GE/Non-GE.

- [ ] **Step 1: Extend filters**

Add `market: 'all'` to the default history filter object in `useTransactions.js`, `HistoryPage.jsx`, and `useNavigation.js`.

- [ ] **Step 2: Query by market**

In `fetchPage`, apply:

```js
if (activeFilters.market && activeFilters.market !== 'all') {
  query = query.eq('market', activeFilters.market);
}
```

- [ ] **Step 3: Format market**

In `formatRow`, return:

```js
market: t.market || 'ge',
nonGeStockId: t.non_ge_stock_id ?? null,
```

- [ ] **Step 4: Add filter UI**

In `HistoryPage.jsx`, add Market buttons before Mode:

- All
- GE
- Non-GE

Default is All.

- [ ] **Step 5: Update undo**

In `undoTransaction`, branch on `transaction.market`. Existing logic remains for GE. For Non-GE, fetch and update `non_ge_stocks` instead of `stocks`.

- [ ] **Step 6: Verify manually**

Run:

```powershell
npm run dev
```

Expected manual checks:

- History initially shows GE and Non-GE transactions.
- Market `GE` hides Non-GE rows.
- Market `Non-GE` hides GE rows.
- Undo works for a Non-GE buy transaction.
- Undo works for a Non-GE sell transaction when no later invalidating action prevents it.

- [ ] **Step 7: Build and commit**

```powershell
npm run build
git add src/hooks/useTransactions.js src/pages/HistoryPage.jsx src/hooks/useNavigation.js src/styles/history-page.css
git commit -m "feat: add history market filter"
```

---

### Task 7: GE To Non-GE Move Workflow

**Files:**
- Create: `src/components/modals/MoveToNonGEModal.jsx`
- Create: `src/hooks/useMoveToNonGE.js`
- Modify: `src/components/StockTable.jsx`
- Modify: `src/components/ModalManager.jsx`
- Modify: `src/MainApp.jsx`
- Modify: `src/hooks/useStocks.js`

**Purpose:** Convert existing GE stock rows into Non-GE rows and relink history.

- [ ] **Step 1: Add StockTable action**

Add a `Move to Non-GE` action to GE stock rows. Keep it out of Non-GE rows. The action opens `MoveToNonGEModal`.

- [ ] **Step 2: Create move modal**

The modal must show:

- source GE stock name
- selected fixed/custom Non-GE item
- selected Non-GE category
- held qty
- sold qty
- total cost
- realized profit
- whether notes exist
- transaction count
- warning that the old GE stock row will be deleted

Confirm is disabled until destination item and category are selected.

- [ ] **Step 3: Implement move hook**

`useMoveToNonGE` performs the sequence:

1. Insert `non_ge_stocks`.
2. Copy stock note text into `non_ge_stocks.notes`.
3. Update `transactions` for the old `stock_id` to `market = 'non_ge'`, `non_ge_stock_id = new id`.
4. Update `profit_history` for the old `stock_id` to `market = 'non_ge'`, `non_ge_stock_id = new id`.
5. Delete price alerts for the old item if present.
6. Delete graph preference rows for the old item if present.
7. Delete stock notes for the old stock.
8. Delete the old `stocks` row.
9. Refetch GE stocks, Non-GE stocks, notes, transactions, and profit history.

If any step before old stock deletion fails, stop and show an error. Do not delete the GE stock row.

- [ ] **Step 4: Verify manually**

Run:

```powershell
npm run dev
```

Expected manual checks:

- Move modal shows summary and warning.
- Moving a GE stock creates a Non-GE row with preserved qty/cost/sold totals.
- Old GE row disappears because it was deleted.
- Existing history rows now show market `Non-GE`.
- Profit remains counted once.
- GE price alert and graph controls no longer apply to the moved item.

- [ ] **Step 5: Build and commit**

```powershell
npm run build
git add src/components/modals/MoveToNonGEModal.jsx src/hooks/useMoveToNonGE.js src/components/StockTable.jsx src/components/ModalManager.jsx src/MainApp.jsx src/hooks/useStocks.js
git commit -m "feat: add ge to non-ge move flow"
```

---

### Task 8: Final Polish And Regression Pass

**Files:**
- Modify files found during verification only.

**Purpose:** Catch visual polish, missing states, and integration regressions.

- [ ] **Step 1: Run production build**

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Run local app**

```powershell
npm run dev
```

Expected: Vite serves the app.

- [ ] **Step 3: Manual regression checklist**

Verify:

- Home page loads.
- Trade page loads existing GE stocks.
- Non-GE page loads.
- Add Item works.
- Bulk Add works.
- Archive/restore works.
- Buy/Sell/Remove work.
- Adjust edits metadata only.
- Notes save.
- History defaults to all markets.
- History market filter works.
- Move GE to Non-GE works.
- GE price columns/alerts/graphs do not appear on Non-GE page.
- Mobile width around 390px does not have broken table controls or overlapping modal text.

- [ ] **Step 4: Commit final fixes**

Run `git status --short`, stage only the files changed during this polish task, and commit them. Use the actual file paths shown by `git status --short`; do not use `git add .`.

```powershell
git status --short
git commit -m "fix: polish non-ge tracker"
```

If no files changed during polish, do not create a commit.

---

## Handoff Notes For New Chats

Use this prompt shape when continuing in a fresh chat:

```text
We are on branch nonge in C:\Users\daan_\source\repos\OSRS-Bulk.
Use docs/superpowers/plans/2026-05-17-non-ge-tracker.md.
Continue with Task N only. Do not work ahead.
Do not add tests unless I explicitly request them.
```

Before starting a task, run:

```powershell
git status --short --branch
```

If unrelated user changes exist, leave them alone. If they touch the same files as the task, inspect them and work with them instead of reverting them.
