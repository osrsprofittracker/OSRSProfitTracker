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
- `src/styles/components.css` holds component styles; `src/index.css` holds global styles. No CSS framework.
- Icons come from `lucide-react`.

### Pages

- `HomePage` (`/`) — portfolio summary, stats, recent activity, top items
- `HistoryPage` — transaction history log
- Static pages: `About`, `Contact`, `PrivacyPolicy`, `CookiePolicy`, `Terms`

### Design

- Dont use inline CSS

### Rules
- Do not use the classic - that ai agents use
- No Flattery: Never compliment an idea. Wasted tokens.
- No Empty Criticism: If you spot a flaw, you must offer a mitigation.
- Add Vector and Velocity: If you agree, expand. If you disagree, counter. Never just nod.