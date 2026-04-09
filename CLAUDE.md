# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Data model conventions

- Supabase columns use `snake_case`; JS objects use `camelCase`. Every hook manually maps between the two.
- All queries filter by `user_id` for row-level isolation.
- `stocks` has an `archived` boolean; default queries exclude archived rows.
- After mutations, hooks generally return a success boolean and let the caller call `refetch()` rather than updating local state directly.

### Key domain concepts

- **Stock** — a tracked OSRS GE item. Holds `shares` (quantity held), `totalCost` (total GP spent buying), `sharesSold`, `totalCostSold`, `totalCostBasisSold` (cost basis of sold shares), `limit4h` (GE 4-hour buy limit), `timerEndTime`, and optional `itemId` linking to the GE API.
- **Profit calculation** — realized profit = `totalCostSold - totalCostBasisSold`. See `src/utils/calculations.js`.
- **GE tax** — 2% capped at 5M GP, with a hardcoded exempt list. See `src/utils/taxUtils.js`. Used for unrealized profit estimates.
- **Unrealized profit** — estimated profit if current stock sold at live GE high price after tax.

### UI structure

- `MainApp` renders `Header`, `PortfolioSummary`, `CategoryQuickNav`, `MilestoneProgressBar`, `ChartButtons`, `CategorySection` (per category), and `Footer`.
- `CategorySection` renders a `StockTable` per category.
- All modals live in `src/components/modals/` and are controlled from `MainApp` via `selectedStock` / modal-open state. `ModalContainer` wraps modal-level concerns.
- `src/styles/` holds component styles split per-component; `src/index.css` holds global styles. No CSS framework.
- Icons come from `lucide-react`.

### Pages

- `HomePage` (`/`) — portfolio summary, stats, recent activity, top items
- `HistoryPage` — transaction history log
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
| `filter-panel.css` | Filter panel in `HistoryPage` |
| `bulk-modals.css` | `BulkBuyModal`, `BulkSellModal` |
| `trade-modal.css` | `TradeModal` (shared buy/sell) |
| `bulk-summary-modal.css` | `BulkSummaryModal` |
| `changelog-modal.css` | `ChangelogModal` |
| `price-alert-modal.css` | `PriceAlertModal` |
| `settings-modal.css` | `SettingsModal` |

### Utilities

- `src/utils/formatters.js`: `formatNumber(num, format)`, `parseMK(str)`, `handleMKInput(value)`
- `src/utils/calculations.js`: profit math
- `src/utils/taxUtils.js`: GE tax (2%, 5M cap)

### Design

- Dont use inline CSS

### Rules
- Do not use the classic - that ai agents use
- No Flattery: Never compliment an idea. Wasted tokens.
- No Empty Criticism: If you spot a flaw, you must offer a mitigation.
- Add Vector and Velocity: If you agree, expand. If you disagree, counter. Never just nod.
- Be Thorough: Ask question when planning