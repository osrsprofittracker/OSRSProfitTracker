# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Architecture

**OSRS Profit Tracker** — a React + Vite SPA backed by Supabase (PostgreSQL + Auth). Deployed on Netlify.

### Entry points

- `src/main.jsx` → mounts `<App />`
- `src/App.jsx` → handles Supabase auth state; routes between `LandingPage`, `Auth`, `UpdatePassword`, and `MainApp`
- `src/MainApp.jsx` → the main authenticated shell; orchestrates all hooks, manages modal state, renders the two pages (`HomePage`, `HistoryPage`)

### Data layer (hooks in `src/hooks/`)

All data lives in Supabase. Each hook wraps a Supabase table and is called from `MainApp` with the user's `userId`:

| Hook | Table(s) | Purpose |
|---|---|---|
| `useStocks` | `stocks` | CRUD + reorder for tracked items |
| `useCategories` | `categories` | Category management |
| `useTransactions` | `transactions` | Buy/sell/adjust trade log |
| `useProfits` | `profits` | Dump/referral/bonds extra income |
| `useStockNotes` | `stock_notes` | Per-item notes |
| `useMilestones` | `milestones` | GP profit milestone tracking |
| `useProfitHistory` | `profit_history` | Daily profit snapshots for charts |
| `useGPTradedStats` | `transactions` | Aggregated GP traded stats |
| `useSettings` | `settings` | Per-user UI preferences |
| `useGEPrices` | external API | Live GE prices from `prices.runescape.wiki/api/v1/osrs` (refreshes every 60s) |
| `useNonGEStocks` | `non_ge_stocks` | Non-GE item holdings, archive, reorder, notes |
| `useNonGECategories` | `non_ge_categories` | Non-GE category management |
| `useNonGECustomItems` | `non_ge_custom_items` | Private user-created Non-GE items |
| `useNonGETradeHandlers` | `non_ge_stocks`, `transactions`, `profit_history` | Non-GE buy/sell/remove/adjust/notes actions |
| `useMoveToNonGE` | `stocks`, `non_ge_stocks`, `transactions`, `profit_history`, cleanup tables | Converts GE stock rows into Non-GE rows |

### Data model conventions

- Supabase columns use `snake_case`; JS objects use `camelCase`. Every hook manually maps between the two.
- All queries filter by `user_id` for row-level isolation.
- `stocks` has an `archived` boolean; default queries exclude archived rows.
- `non_ge_stocks` also has an `archived` boolean; default Non-GE queries exclude archived rows.
- `transactions` and `profit_history` use `market` (`ge` or `non_ge`) plus `non_ge_stock_id` for unified history/profit rows.
- After mutations, hooks generally return a success boolean and let the caller call `refetch()` rather than updating local state directly.

### Supabase Data API grants

- This app uses `supabase-js` from the browser, so public tables accessed by `.from(...)` must be reachable through the Supabase Data API.
- When proposing or adding a new Supabase table that the frontend will access, include explicit SQL for Data API grants, RLS, and policies. Do not rely on Supabase automatically exposing new `public` tables.
- Follow the repo rule below: do not add migration files. Provide the SQL for manual application in the Supabase SQL Editor.
- For normal user-owned app tables, use this default pattern and adapt table/column names as needed:

```sql
grant select, insert, update, delete
on table public.your_new_table
to authenticated;

alter table public.your_new_table enable row level security;

create policy "Users can manage their own rows"
on public.your_new_table
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

- For read-only views, grant only `select` to `authenticated`.
- Only grant `anon` access when unauthenticated browser behavior explicitly needs it, and pair it with narrow RLS policies.

### Key domain concepts

- **Stock** — a tracked OSRS GE item. Holds `shares` (quantity held), `totalCost` (total GP spent buying), `sharesSold`, `totalCostSold`, `totalCostBasisSold` (cost basis of sold shares), `limit4h` (GE 4-hour buy limit), `timerEndTime`, and optional `itemId` linking to the GE API.
- **Non-GE stock** — a tracked item outside Grand Exchange pricing. Stored separately in `non_ge_stocks`; uses `catalogItemKey` for fixed catalog items or `customItemId` for private user-created items, plus `nameSnapshot`, Non-GE `categoryId`, target buy/sell prices, notes, and the same held/sold cost fields as GE stocks.
- **Non-GE catalog** — fixed frontend data in `src/data/nonGeCatalog.js`, with helpers in `src/utils/nonGeCatalog.js`. Catalog updates are code/content changes, not user data migrations.
- **Profit calculation** — realized profit = `totalCostSold - totalCostBasisSold`. See `src/utils/calculations.js`.
- **GE tax** — 2% capped at 5M GP, with a hardcoded exempt list. See `src/utils/taxUtils.js`. Used for unrealized profit estimates.
- **Unrealized profit** — estimated profit if current stock sold at live GE high price after tax.
- **Non-GE profit** — uses the same realized average-cost formula as GE, but does not use GE prices, GE tax, timers, limits, alerts, graphs, or calculators.
- **GE to Non-GE move** — available from GE stock rows. It creates a Non-GE row, copies notes into `non_ge_stocks.notes`, relinks matching `transactions` and `profit_history` rows to `market = 'non_ge'`, cleans up price alerts/graph preferences/stock notes, then deletes the original GE stock row.

### UI structure

- `MainApp` renders `Header`, `PortfolioSummary`, `CategoryQuickNav`, `MilestoneProgressBar`, `ChartButtons`, `CategorySection` (per GE category), `NonGEPage`, and `Footer`.
- `CategorySection` renders a `StockTable` per category.
- `NonGEPage` renders Non-GE summary cards and `NonGECategorySection` / `NonGETable` per Non-GE category.
- Non-GE category headers intentionally reuse the same category header classes and collapse symbol style as the GE trade page.
- All modals live in `src/components/modals/` and are controlled from `MainApp` via `selectedStock` / modal-open state. `ModalContainer` wraps modal-level concerns.
- `src/styles/` holds component styles split per-component; `src/index.css` holds global styles. No CSS framework.
- Icons come from `lucide-react`.

### Pages

- `HomePage` (`/`) — portfolio summary, stats, recent activity, top items
- Trade page (`/trade`) — authenticated GE tracker with categories, GE price columns, timers, alerts, graphs, and calculators
- `NonGEPage` (`/nonge`) — authenticated Non-GE tracker with fixed catalog/custom items, Non-GE categories, archive, buy/sell/remove/adjust, and notes
- `HistoryPage` — unified transaction/profit log; defaults to all markets and has Market filters for All, GE, and Non-GE
- `AnalyticsPage` — analytics from transactions, stocks, and `profit_history`; all-time stock profit currently uses GE `stocks` totals, while timeframe buckets are built from `profit_history` and can include Non-GE rows unless future work adds explicit market filtering
- Static pages: `About`, `Contact`, `PrivacyPolicy`, `CookiePolicy`, `Terms`

### MainApp.jsx structure

`MainApp.jsx` is the orchestrator. Key sections by line area:

- **Imports** (top ~50 lines): all hooks, components, contexts
- **Hook calls** (~line 70-190): `useStocks`, `useTransactions`, `useCategories`, etc.
- **Modal integration** (~line 187): `useModal()` from `ModalContext` for open/close/selectedStock
- **Handlers** (~line 706): destructured from `useModalHandlers()` hook
- **JSX** (~line 1400): renders `<ModalManager>` which owns all modal rendering

### Modal pattern

Modals use a context-based system:
1. `ModalContext` (`src/contexts/ModalContext.jsx`) manages open/close state for all modals via `openModal(name)` / `closeModal(name)`
2. `useModalHandlers` (`src/hooks/useModalHandlers.js`) contains all confirm/submit handlers (`handleBuy`, `handleBulkBuy`, `handleSell`, etc.)
3. `ModalManager` (`src/components/ModalManager.jsx`) renders all `<ModalContainer isOpen={...}>` blocks in one place
4. Individual modal components in `src/components/modals/XModal.jsx` receive `onConfirm` and `onCancel`
5. `ModalContainer` is a fixed overlay with z-index 200, renders null when closed

Non-GE modals currently include:

- `NonGEAddItemModal`
- `NonGEBulkAddModal`
- `NonGEArchiveModal`
- `NonGETradeModal`
- `NonGEAdjustModal`
- `MoveToNonGEModal`

### CSS conventions

- Styles live in `src/styles/`, one file per component/feature. Each component imports its own CSS file.
- `shared.css` — reusable classes (modal base, form elements, common patterns)
- BEM-like naming: `.component-name`, `.component-name-element`, `.component-name-element.modifier`
- Modal colors: `rgb(22, 30, 46)` background, `rgba(51, 65, 85, 0.6)` borders
- Green confirm: `rgb(21, 128, 61)`, gray cancel: `rgba(71, 85, 105, 0.5)`
- Modal dimensions: `52rem` wide (or smaller for simple modals), `75vh` tall, `0.875rem` border-radius
- Mobile breakpoint: `@media (max-width: 640px)` — modals go full width, `95vh`

#### CSS file map

| File | Component(s) |
|---|---|
| `shared.css` | Reusable modal/form/layout classes |
| `auth.css` | `Auth`, `UpdatePassword` |
| `header.css` | `Header` |
| `quick-nav.css` | `CategoryQuickNav` |
| `category-section.css` | `CategorySection` |
| `table.css` | `StockTable` |
| `global-search.css` | `GlobalSearch` |
| `notification-center.css` | `NotificationCenter` |
| `home-page.css` | `HomePage` |
| `history-page.css` | `HistoryPage` |
| `graphs-page.css` | `GraphsPage` |
| `non-ge-page.css` | `NonGEPage`, Non-GE table, Non-GE modals |
| `filter-panel.css` | Filter panel in `HistoryPage` |
| `bulk-trade-modal.css` | `BulkTradeModal` (shared bulk buy/sell) |
| `trade-modal.css` | `TradeModal` (shared buy/sell) |
| `bulk-summary-modal.css` | `BulkSummaryModal` |
| `changelog-modal.css` | `ChangelogModal` |
| `price-alert-modal.css` | `PriceAlertModal` |
| `settings-modal.css` | `SettingsModal` |

### Utilities

- `src/utils/formatters.js`: `formatNumber(num, format)`, `parseMK(str)`, `handleMKInput(value)`
- `src/utils/calculations.js`: profit math
- `src/utils/taxUtils.js`: GE tax (2%, 5M cap)
- `src/utils/nonGeCatalog.js`: Non-GE catalog lookup, search normalization, display names, wiki image helpers

### Design

- Dont use inline CSS

### GitHub workflow

- Repository: `osrsprofittracker/OSRSProfitTracker`.
- For creating or editing GitHub issues, use the local `gh` CLI first. The GitHub connector may return `403 Resource not accessible by integration` for issue writes in this repo.
- Check auth with `gh auth status` only if a `gh` command fails.
- Create backlog issues with `gh issue create --repo osrsprofittracker/OSRSProfitTracker --title "..." --body "..."`.
- Do not add a `backlog` label unless it exists; this repo currently did not have that label when last checked.
- Use the GitHub connector for reading PRs/issues when convenient, but prefer `gh` for write actions that need repo permissions.

### Rules
- Do not use the classic - that ai agents use
- Do not add automated tests, test files, test runners, or test-related dependencies unless explicitly requested.
- Do not add database migration files. If a database change is needed, provide SQL for manual Supabase SQL Editor application instead.
- No Flattery: Never compliment an idea. Wasted tokens.
- No Empty Criticism: If you spot a flaw, you must offer a mitigation.
- Add Vector and Velocity: If you agree, expand. If you disagree, counter. Never just nod.
- Be Thorough: Ask question when planning
