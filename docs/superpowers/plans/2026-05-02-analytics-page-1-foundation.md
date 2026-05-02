# Analytics Page — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `/analytics` route with a working KPI band, tab nav, global timeframe selector, and the Supabase data layer. After this plan, `/analytics` is reachable from the top nav, the four tabs render empty placeholders, the four KPI cards show live numbers, and the legacy pie-chart modals are gone.

**Architecture:** New Postgres RPC `get_analytics_buckets` aggregates profit and GP traded into daily/weekly/monthly buckets. A `useAnalytics` hook wraps the RPC with a client-side fallback aggregator. A `useAnalyticsTimeframe` hook owns the global window/bucket state. `AnalyticsPage` composes a KPI band + tab nav + active tab content. `recharts` is added as a dep for later tab work; `vitest` is added so we can test the data layer. Existing `ChartButtons`, `ProfitChartModal`, and `CategoryChartModal` are deleted, and the Alt Account Timer is relocated to the trade page.

**Tech Stack:** React 18, Vite 7, Supabase JS 2, recharts (new), vitest (new), lucide-react (existing).

**Reference spec:** `docs/superpowers/specs/2026-05-02-analytics-page-design.md`

---

## File Structure

**Created:**
- `supabase/migrations/2026_05_02_analytics_buckets.sql` — RPC migration
- `src/hooks/useAnalyticsTimeframe.js` — window/bucket state
- `src/hooks/useAnalyticsTimeframe.test.js`
- `src/hooks/useAnalytics.js` — RPC wrapper + fallback aggregator
- `src/hooks/useAnalytics.test.js`
- `src/pages/AnalyticsPage.jsx` — page shell
- `src/components/analytics/KpiBand.jsx`
- `src/components/analytics/TabNav.jsx`
- `src/components/analytics/TimeframeSelector.jsx`
- `src/components/analytics/ProfitTab.jsx` — placeholder (filled in Plan 2)
- `src/components/analytics/ItemsTab.jsx` — placeholder (filled in Plan 3)
- `src/components/analytics/CategoriesTab.jsx` — placeholder (filled in Plan 4)
- `src/components/analytics/GoalsTab.jsx` — placeholder (filled in Plan 5)
- `src/components/AltAccountTimer.jsx` — extracted from ChartButtons
- `src/styles/analytics-page.css`
- `vitest.config.js`
- `src/test-setup.js` — vitest jsdom setup

**Modified:**
- `package.json` — add `recharts`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`
- `src/MainApp.jsx` — add analytics route + nav button, remove ChartButtons usage, render AltAccountTimer in trade page header
- `src/hooks/useModalHandlers.js` — remove profit/category chart modal handlers
- `src/components/ModalManager.jsx` — remove ProfitChartModal/CategoryChartModal renders
- `src/contexts/ModalContext.jsx` — remove their modal names if explicitly listed

**Deleted:**
- `src/components/ChartButtons.jsx`
- `src/components/modals/ProfitChartModal.jsx`
- `src/components/modals/CategoryChartModal.jsx`

---

## Phase A: Setup

### Task A1: Add dependencies and Vitest config

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/test-setup.js`

- [ ] **Step 1: Install dependencies**

```bash
npm install recharts
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Add test scripts to `package.json`**

In `package.json`, change the `"scripts"` block to:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
});
```

- [ ] **Step 4: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Smoke-test the runner**

Run: `npm test`
Expected: "No test files found" (exit 0). The runner is wired up.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.js src/test-setup.js
git commit -m "chore: add recharts and vitest"
```

---

### Task A2: Supabase RPC `get_analytics_buckets`

**Files:**
- Create: `supabase/migrations/2026_05_02_analytics_buckets.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/2026_05_02_analytics_buckets.sql
create or replace function public.get_analytics_buckets(
  p_user_id uuid,
  p_start   date,
  p_end     date,
  p_bucket  text   -- 'day' | 'week' | 'month'
)
returns table(
  bucket_date     date,
  profit_items    bigint,
  profit_dump     bigint,
  profit_referral bigint,
  profit_bonds    bigint,
  gp_traded       bigint,
  by_category     jsonb,
  sells_count     int,
  wins_count      int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid bucket: %', p_bucket;
  end if;

  return query
  with sells as (
    select
      date_trunc(p_bucket, t.date)::date as bucket_date,
      coalesce(s.category, 'Uncategorized') as category,
      (t.total - coalesce(t.cost_basis, 0)) as profit,
      t.total as turnover,
      1 as sells_count,
      case when (t.total - coalesce(t.cost_basis, 0)) > 0 then 1 else 0 end as is_win
    from transactions t
    left join stocks s on s.id = t.stock_id
    where t.user_id = p_user_id
      and t.type = 'sell'
      and t.date >= p_start
      and t.date <  p_end + interval '1 day'
  ),
  buys as (
    select
      date_trunc(p_bucket, t.date)::date as bucket_date,
      t.total as turnover
    from transactions t
    where t.user_id = p_user_id
      and t.type = 'buy'
      and t.date >= p_start
      and t.date <  p_end + interval '1 day'
  ),
  other_profit as (
    select
      date_trunc(p_bucket, ph.created_at)::date as bucket_date,
      ph.profit_type,
      ph.amount
    from profit_history ph
    where ph.user_id = p_user_id
      and ph.profit_type in ('dump', 'referral', 'bonds')
      and ph.created_at >= p_start
      and ph.created_at <  p_end + interval '1 day'
  ),
  sells_agg as (
    select bucket_date,
           sum(profit)::bigint as profit_items,
           sum(turnover)::bigint as turnover,
           sum(sells_count)::int as sells_count,
           sum(is_win)::int as wins_count,
           jsonb_object_agg(category, cat_profit) as by_category
    from (
      select bucket_date, category, sum(profit) as cat_profit, sum(turnover) as turnover,
             sum(sells_count) as sells_count, sum(is_win) as is_win
      from sells
      group by bucket_date, category
    ) per_cat
    group by bucket_date
  ),
  buys_agg as (
    select bucket_date, sum(turnover)::bigint as turnover
    from buys
    group by bucket_date
  ),
  other_agg as (
    select
      bucket_date,
      sum(case when profit_type = 'dump'     then amount else 0 end)::bigint as profit_dump,
      sum(case when profit_type = 'referral' then amount else 0 end)::bigint as profit_referral,
      sum(case when profit_type = 'bonds'    then amount else 0 end)::bigint as profit_bonds
    from other_profit
    group by bucket_date
  ),
  all_buckets as (
    select bucket_date from sells_agg
    union
    select bucket_date from buys_agg
    union
    select bucket_date from other_agg
  )
  select
    b.bucket_date,
    coalesce(s.profit_items, 0)::bigint,
    coalesce(o.profit_dump, 0)::bigint,
    coalesce(o.profit_referral, 0)::bigint,
    coalesce(o.profit_bonds, 0)::bigint,
    (coalesce(s.turnover, 0) + coalesce(bu.turnover, 0))::bigint as gp_traded,
    coalesce(s.by_category, '{}'::jsonb),
    coalesce(s.sells_count, 0)::int,
    coalesce(s.wins_count, 0)::int
  from all_buckets b
  left join sells_agg s on s.bucket_date = b.bucket_date
  left join buys_agg  bu on bu.bucket_date = b.bucket_date
  left join other_agg o on o.bucket_date = b.bucket_date
  order by b.bucket_date asc;
end;
$$;

grant execute on function public.get_analytics_buckets(uuid, date, date, text) to authenticated;
```

> **NOTE:** The migration assumes `transactions` has a `cost_basis` column populated for sells. If it doesn't, see the integration test in Task B2 — the fallback aggregator computes basis from the matching stock and the migration may need a follow-up to add the column. Check the actual schema before running.

- [ ] **Step 2: Verify the schema assumption**

Run a Supabase REST query to inspect the `transactions` table columns. From `.env`, take `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL`:

```bash
curl "$VITE_SUPABASE_URL/rest/v1/transactions?select=*&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Confirm whether `cost_basis` exists. If not, the migration must compute basis differently (e.g., look up `stocks.total_cost_basis_sold` proportionally). **Stop and ask before running the migration if the column is missing.**

- [ ] **Step 3: Apply the migration**

Run via Supabase CLI or paste into the SQL editor in the dashboard. After running:

```bash
curl -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/get_analytics_buckets" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id":"<your-user-id>","p_start":"2026-04-01","p_end":"2026-05-02","p_bucket":"day"}'
```

Expected: a JSON array of bucket rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026_05_02_analytics_buckets.sql
git commit -m "feat(db): add get_analytics_buckets RPC"
```

---

## Phase B: Hooks

### Task B1: `useAnalyticsTimeframe`

**Files:**
- Create: `src/hooks/useAnalyticsTimeframe.js`
- Test: `src/hooks/useAnalyticsTimeframe.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/hooks/useAnalyticsTimeframe.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsTimeframe } from './useAnalyticsTimeframe';

describe('useAnalyticsTimeframe', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to 1M when no localStorage entry exists', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));
    expect(result.current.window).toBe('1M');
  });

  it('derives bucket=day for 1W/1M/3M', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));
    act(() => result.current.setWindow('1W'));
    expect(result.current.bucket).toBe('day');
    act(() => result.current.setWindow('1M'));
    expect(result.current.bucket).toBe('day');
    act(() => result.current.setWindow('3M'));
    expect(result.current.bucket).toBe('day');
  });

  it('derives bucket=week for 6M/1Y', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));
    act(() => result.current.setWindow('6M'));
    expect(result.current.bucket).toBe('week');
    act(() => result.current.setWindow('1Y'));
    expect(result.current.bucket).toBe('week');
  });

  it('derives bucket=month for All', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));
    act(() => result.current.setWindow('All'));
    expect(result.current.bucket).toBe('month');
  });

  it('persists window selection per user', () => {
    const { result, unmount } = renderHook(() => useAnalyticsTimeframe('user-1'));
    act(() => result.current.setWindow('3M'));
    unmount();
    const { result: result2 } = renderHook(() => useAnalyticsTimeframe('user-1'));
    expect(result2.current.window).toBe('3M');
  });

  it('returns ISO date strings for start/end', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));
    expect(result.current.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- useAnalyticsTimeframe`
Expected: FAIL with "Cannot find module './useAnalyticsTimeframe'".

- [ ] **Step 3: Implement `useAnalyticsTimeframe`**

```js
// src/hooks/useAnalyticsTimeframe.js
import { useState, useMemo, useCallback } from 'react';

const WINDOW_OPTIONS = ['1W', '1M', '3M', '6M', '1Y', 'All'];

const bucketForWindow = (window) => {
  if (window === '1W' || window === '1M' || window === '3M') return 'day';
  if (window === '6M' || window === '1Y') return 'week';
  return 'month';
};

const daysForWindow = (window) => {
  switch (window) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case 'All': return null;
    default: return 30;
  }
};

const toIsoDate = (d) => d.toISOString().slice(0, 10);

export function useAnalyticsTimeframe(userId, allTimeStart = null) {
  const storageKey = `analyticsTimeframe_${userId}`;

  const [window, setWindowState] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return WINDOW_OPTIONS.includes(stored) ? stored : '1M';
  });

  const setWindow = useCallback((next) => {
    if (!WINDOW_OPTIONS.includes(next)) return;
    setWindowState(next);
    localStorage.setItem(storageKey, next);
  }, [storageKey]);

  const { start, end, bucket } = useMemo(() => {
    const today = new Date();
    const endIso = toIsoDate(today);
    const days = daysForWindow(window);
    let startIso;
    if (days == null) {
      startIso = allTimeStart || '2020-01-01';
    } else {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days);
      startIso = toIsoDate(startDate);
    }
    return { start: startIso, end: endIso, bucket: bucketForWindow(window) };
  }, [window, allTimeStart]);

  return { window, setWindow, start, end, bucket, options: WINDOW_OPTIONS };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- useAnalyticsTimeframe`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAnalyticsTimeframe.js src/hooks/useAnalyticsTimeframe.test.js
git commit -m "feat(analytics): add useAnalyticsTimeframe hook"
```

---

### Task B2: `useAnalytics` with RPC + fallback

**Files:**
- Create: `src/hooks/useAnalytics.js`
- Test: `src/hooks/useAnalytics.test.js`

- [ ] **Step 1: Write the failing test for the fallback aggregator**

```js
// src/hooks/useAnalytics.test.js
import { describe, it, expect } from 'vitest';
import { aggregateBucketsLocally } from './useAnalytics';

const t = (overrides) => ({
  id: 1,
  user_id: 'u1',
  stock_id: 1,
  type: 'sell',
  total: 0,
  cost_basis: 0,
  date: '2026-04-15',
  ...overrides,
});

describe('aggregateBucketsLocally', () => {
  it('buckets sells into days, computes profit_items and gp_traded', () => {
    const transactions = [
      t({ id: 1, type: 'buy',  total: 100, date: '2026-04-15' }),
      t({ id: 2, type: 'sell', total: 200, cost_basis: 120, date: '2026-04-15', stock_id: 1 }),
      t({ id: 3, type: 'sell', total: 150, cost_basis: 100, date: '2026-04-16', stock_id: 1 }),
    ];
    const stocks = [{ id: 1, category: 'Runes' }];
    const profitHistory = [];
    const result = aggregateBucketsLocally({
      transactions, stocks, profitHistory,
      start: '2026-04-15', end: '2026-04-16', bucket: 'day',
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      bucket_date: '2026-04-15',
      profit_items: 80,
      gp_traded: 300,
      sells_count: 1,
      wins_count: 1,
      by_category: { Runes: 80 },
    });
    expect(result[1]).toMatchObject({
      bucket_date: '2026-04-16',
      profit_items: 50,
      gp_traded: 150,
      sells_count: 1,
      wins_count: 1,
    });
  });

  it('includes dump/referral/bonds from profit_history', () => {
    const result = aggregateBucketsLocally({
      transactions: [],
      stocks: [],
      profitHistory: [
        { profit_type: 'dump',     amount: 1000, created_at: '2026-04-15T10:00:00Z' },
        { profit_type: 'referral', amount:  200, created_at: '2026-04-15T11:00:00Z' },
        { profit_type: 'bonds',    amount:  500, created_at: '2026-04-16T09:00:00Z' },
      ],
      start: '2026-04-15', end: '2026-04-16', bucket: 'day',
    });
    expect(result.find(r => r.bucket_date === '2026-04-15')).toMatchObject({
      profit_dump: 1000, profit_referral: 200, profit_bonds: 0,
    });
    expect(result.find(r => r.bucket_date === '2026-04-16')).toMatchObject({
      profit_bonds: 500,
    });
  });

  it('counts losing sells in sells_count but not wins_count', () => {
    const result = aggregateBucketsLocally({
      transactions: [
        t({ id: 1, type: 'sell', total: 50,  cost_basis: 100, date: '2026-04-15' }),
        t({ id: 2, type: 'sell', total: 200, cost_basis: 120, date: '2026-04-15' }),
      ],
      stocks: [{ id: 1, category: 'Runes' }],
      profitHistory: [],
      start: '2026-04-15', end: '2026-04-15', bucket: 'day',
    });
    expect(result[0]).toMatchObject({ sells_count: 2, wins_count: 1 });
  });

  it('buckets weekly when bucket=week', () => {
    const result = aggregateBucketsLocally({
      transactions: [
        t({ id: 1, type: 'sell', total: 100, cost_basis: 50, date: '2026-04-13' }), // Mon
        t({ id: 2, type: 'sell', total: 100, cost_basis: 50, date: '2026-04-19' }), // Sun, same ISO week
        t({ id: 3, type: 'sell', total: 100, cost_basis: 50, date: '2026-04-20' }), // Mon, next week
      ],
      stocks: [{ id: 1, category: 'Runes' }],
      profitHistory: [],
      start: '2026-04-13', end: '2026-04-20', bucket: 'week',
    });
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm test -- useAnalytics`
Expected: FAIL with "Cannot find module './useAnalytics'".

- [ ] **Step 3: Implement the hook + fallback aggregator**

```js
// src/hooks/useAnalytics.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const cache = new Map();

const truncDay = (d) => d.slice(0, 10);

const truncWeek = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
};

const truncMonth = (dateStr) => dateStr.slice(0, 7) + '-01';

const truncBucket = (dateStr, bucket) => {
  if (bucket === 'day') return truncDay(dateStr);
  if (bucket === 'week') return truncWeek(dateStr);
  return truncMonth(dateStr);
};

export function aggregateBucketsLocally({ transactions, stocks, profitHistory, start, end, bucket }) {
  const stockMap = new Map(stocks.map(s => [s.id, s]));
  const inWindow = (iso) => iso >= start && iso <= end;
  const buckets = new Map();

  const ensureBucket = (key) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        bucket_date: key,
        profit_items: 0,
        profit_dump: 0,
        profit_referral: 0,
        profit_bonds: 0,
        gp_traded: 0,
        by_category: {},
        sells_count: 0,
        wins_count: 0,
      });
    }
    return buckets.get(key);
  };

  for (const tx of transactions) {
    const iso = String(tx.date).slice(0, 10);
    if (!inWindow(iso)) continue;
    const key = truncBucket(iso, bucket);
    const b = ensureBucket(key);
    b.gp_traded += Number(tx.total) || 0;
    if (tx.type === 'sell') {
      const profit = (Number(tx.total) || 0) - (Number(tx.cost_basis) || 0);
      b.profit_items += profit;
      b.sells_count += 1;
      if (profit > 0) b.wins_count += 1;
      const cat = stockMap.get(tx.stock_id)?.category || 'Uncategorized';
      b.by_category[cat] = (b.by_category[cat] || 0) + profit;
    }
  }

  for (const ph of profitHistory) {
    const iso = String(ph.created_at).slice(0, 10);
    if (!inWindow(iso)) continue;
    const key = truncBucket(iso, bucket);
    const b = ensureBucket(key);
    if (ph.profit_type === 'dump')     b.profit_dump     += Number(ph.amount) || 0;
    if (ph.profit_type === 'referral') b.profit_referral += Number(ph.amount) || 0;
    if (ph.profit_type === 'bonds')    b.profit_bonds    += Number(ph.amount) || 0;
  }

  return [...buckets.values()].sort((a, b) => a.bucket_date.localeCompare(b.bucket_date));
}

export function useAnalytics({ userId, start, end, bucket, fallbackData }) {
  const [state, setState] = useState({ buckets: [], loading: true, error: null, fromFallback: false });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const cacheKey = `${userId}-${start}-${end}-${bucket}`;
    if (cache.has(cacheKey)) {
      setState({ buckets: cache.get(cacheKey), loading: false, error: null, fromFallback: false });
      return;
    }

    const myRequest = ++requestIdRef.current;
    setState(s => ({ ...s, loading: true, error: null }));

    supabase.rpc('get_analytics_buckets', {
      p_user_id: userId, p_start: start, p_end: end, p_bucket: bucket,
    }).then(({ data, error }) => {
      if (myRequest !== requestIdRef.current) return;
      if (error) {
        const local = fallbackData
          ? aggregateBucketsLocally({ ...fallbackData, start, end, bucket })
          : [];
        setState({ buckets: local, loading: false, error: error.message, fromFallback: true });
        return;
      }
      cache.set(cacheKey, data || []);
      setState({ buckets: data || [], loading: false, error: null, fromFallback: false });
    });
  }, [userId, start, end, bucket, fallbackData]);

  return state;
}

export const __clearAnalyticsCache = () => cache.clear();
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- useAnalytics`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAnalytics.js src/hooks/useAnalytics.test.js
git commit -m "feat(analytics): add useAnalytics hook with RPC and local fallback"
```

---

## Phase C: UI shell

### Task C1: `TimeframeSelector`

**Files:**
- Create: `src/components/analytics/TimeframeSelector.jsx`
- Modify: `src/styles/analytics-page.css` (new file)

- [ ] **Step 1: Create stylesheet**

```css
/* src/styles/analytics-page.css */
.analytics-page {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.analytics-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.analytics-page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.analytics-page-subtitle {
  color: rgb(148, 163, 184);
  margin: 0.25rem 0 0;
}

.analytics-timeframe {
  display: flex;
  gap: 0.25rem;
  background: rgb(30, 41, 59);
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(51, 65, 85);
}

.analytics-timeframe-btn {
  padding: 0.5rem 0.875rem;
  background: transparent;
  border: none;
  color: rgb(148, 163, 184);
  cursor: pointer;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.8125rem;
  transition: background 0.15s, color 0.15s;
}

.analytics-timeframe-btn:hover {
  background: rgba(168, 85, 247, 0.15);
  color: white;
}

.analytics-timeframe-btn.is-active {
  background: rgb(168, 85, 247);
  color: white;
}

.analytics-tab-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgb(51, 65, 85);
  margin: 1.5rem 0 1.5rem;
}

.analytics-tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  color: rgb(148, 163, 184);
  cursor: pointer;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.analytics-tab-btn:hover {
  color: white;
}

.analytics-tab-btn.is-active {
  color: white;
  border-bottom-color: rgb(168, 85, 247);
}

.analytics-kpi-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.analytics-tab-content {
  min-height: 24rem;
}

.analytics-empty {
  text-align: center;
  color: rgb(148, 163, 184);
  padding: 4rem 1rem;
}

.analytics-fallback-banner {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: rgb(234, 179, 8);
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .analytics-page { padding: 0.75rem; }
  .analytics-kpi-band { grid-template-columns: repeat(2, 1fr); }
  .analytics-tab-nav { overflow-x: auto; }
  .analytics-timeframe { flex-wrap: wrap; }
}
```

- [ ] **Step 2: Implement `TimeframeSelector`**

```jsx
// src/components/analytics/TimeframeSelector.jsx
import React from 'react';

export default function TimeframeSelector({ window, options, onChange }) {
  return (
    <div className="analytics-timeframe" role="tablist" aria-label="Timeframe">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={window === opt}
          className={`analytics-timeframe-btn${window === opt ? ' is-active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analytics/TimeframeSelector.jsx src/styles/analytics-page.css
git commit -m "feat(analytics): add TimeframeSelector and base page styles"
```

---

### Task C2: `KpiBand`

**Files:**
- Create: `src/components/analytics/KpiBand.jsx`

- [ ] **Step 1: Implement `KpiBand`**

```jsx
// src/components/analytics/KpiBand.jsx
import React from 'react';
import { formatNumber } from '../../utils/formatters';
import '../../styles/home-page.css';

const formatDelta = (current, prior, numberFormat) => {
  if (prior == null || prior === 0) return null;
  const pct = ((current - prior) / Math.abs(prior)) * 100;
  return { pct, sign: pct >= 0 ? '+' : '' };
};

function KpiCard({ label, icon, value, deltaPct, numberFormat, valueClass = '' }) {
  const deltaColor = deltaPct == null
    ? 'rgb(148, 163, 184)'
    : deltaPct >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <span className="summary-card-icon">{icon}</span>
        <span className="summary-card-label">{label}</span>
      </div>
      <div className={`summary-card-value ${valueClass}`}>
        {formatNumber(value, numberFormat)}
      </div>
      {deltaPct != null && (
        <div style={{ color: deltaColor, fontSize: '0.8125rem', fontWeight: 600 }}>
          {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}% vs prior
        </div>
      )}
    </div>
  );
}

export default function KpiBand({
  totalProfit,
  periodProfit,
  priorPeriodProfit,
  gpTraded,
  priorGpTraded,
  inventoryValue,
  numberFormat,
  loading,
}) {
  if (loading) {
    return (
      <div className="analytics-kpi-band">
        {[0,1,2,3].map(i => (
          <div key={i} className="summary-card" style={{ minHeight: '7rem', opacity: 0.5 }}>
            <div className="summary-card-label">Loading…</div>
          </div>
        ))}
      </div>
    );
  }

  const periodDelta = formatDelta(periodProfit, priorPeriodProfit);
  const gpDelta = formatDelta(gpTraded, priorGpTraded);

  return (
    <div className="analytics-kpi-band">
      <KpiCard label="Total Profit" icon="💰" value={totalProfit} numberFormat={numberFormat} valueClass="profit-main-value" />
      <KpiCard label="Period Profit" icon="📈" value={periodProfit} deltaPct={periodDelta?.pct} numberFormat={numberFormat} />
      <KpiCard label="GP Traded (period)" icon="🔁" value={gpTraded} deltaPct={gpDelta?.pct} numberFormat={numberFormat} valueClass="gp-traded-main-value" />
      <KpiCard label="Inventory Value" icon="📦" value={inventoryValue} numberFormat={numberFormat} valueClass="inventory-main-value" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/KpiBand.jsx
git commit -m "feat(analytics): add KpiBand component"
```

---

### Task C3: `TabNav`

**Files:**
- Create: `src/components/analytics/TabNav.jsx`

- [ ] **Step 1: Implement `TabNav`**

```jsx
// src/components/analytics/TabNav.jsx
import React from 'react';

const TABS = [
  { id: 'profit',     label: 'Profit' },
  { id: 'items',      label: 'Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'goals',      label: 'Goals' },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <div className="analytics-tab-nav" role="tablist">
      {TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`analytics-tab-btn${activeTab === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export const ANALYTICS_TABS = TABS.map(t => t.id);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/TabNav.jsx
git commit -m "feat(analytics): add TabNav component"
```

---

### Task C4: Tab placeholders

**Files:**
- Create: `src/components/analytics/ProfitTab.jsx`
- Create: `src/components/analytics/ItemsTab.jsx`
- Create: `src/components/analytics/CategoriesTab.jsx`
- Create: `src/components/analytics/GoalsTab.jsx`

- [ ] **Step 1: Create the four placeholder files**

Each file is identical except for the label. Example for `ProfitTab.jsx`:

```jsx
// src/components/analytics/ProfitTab.jsx
import React from 'react';

export default function ProfitTab() {
  return (
    <div className="analytics-empty">
      <p>Profit tab coming in Plan 2.</p>
    </div>
  );
}
```

Repeat for `ItemsTab.jsx` ("Items tab coming in Plan 3."), `CategoriesTab.jsx` ("Categories tab coming in Plan 4."), `GoalsTab.jsx` ("Goals tab coming in Plan 5.").

- [ ] **Step 2: Commit**

```bash
git add src/components/analytics/ProfitTab.jsx src/components/analytics/ItemsTab.jsx src/components/analytics/CategoriesTab.jsx src/components/analytics/GoalsTab.jsx
git commit -m "feat(analytics): add empty tab placeholders"
```

---

### Task C5: `AnalyticsPage` shell

**Files:**
- Create: `src/pages/AnalyticsPage.jsx`

- [ ] **Step 1: Implement the page**

```jsx
// src/pages/AnalyticsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAnalyticsTimeframe } from '../hooks/useAnalyticsTimeframe';
import { useAnalytics } from '../hooks/useAnalytics';
import TimeframeSelector from '../components/analytics/TimeframeSelector';
import TabNav, { ANALYTICS_TABS } from '../components/analytics/TabNav';
import KpiBand from '../components/analytics/KpiBand';
import ProfitTab from '../components/analytics/ProfitTab';
import ItemsTab from '../components/analytics/ItemsTab';
import CategoriesTab from '../components/analytics/CategoriesTab';
import GoalsTab from '../components/analytics/GoalsTab';
import { useTrade } from '../contexts/TradeContext';
import '../styles/analytics-page.css';

const subtractDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const sumProfit = (buckets) =>
  buckets.reduce((s, b) => s + (b.profit_items || 0) + (b.profit_dump || 0) + (b.profit_referral || 0) + (b.profit_bonds || 0), 0);

const sumGpTraded = (buckets) => buckets.reduce((s, b) => s + (b.gp_traded || 0), 0);

export default function AnalyticsPage({ userId, transactions, profitHistory, numberFormat, initialTab }) {
  const { allStocks, stocks } = useTrade();
  const stocksForStats = allStocks?.length > 0 ? allStocks : stocks;

  const [activeTab, setActiveTab] = useState(() => {
    return ANALYTICS_TABS.includes(initialTab) ? initialTab : 'profit';
  });
  const [mountedTabs, setMountedTabs] = useState(() => new Set([activeTab]));

  const tf = useAnalyticsTimeframe(userId);
  const priorStart = useMemo(
    () => subtractDays(tf.start, daysBetween(tf.start, tf.end)),
    [tf.start, tf.end]
  );

  const fallbackData = useMemo(
    () => ({ transactions: transactions || [], stocks: stocksForStats || [], profitHistory: profitHistory || [] }),
    [transactions, stocksForStats, profitHistory]
  );

  const current = useAnalytics({ userId, start: tf.start, end: tf.end, bucket: tf.bucket, fallbackData });
  const prior = useAnalytics({ userId, start: priorStart, end: tf.start, bucket: tf.bucket, fallbackData });

  const totalProfit = useMemo(() => {
    const stocksProfit = (stocksForStats || []).reduce(
      (s, st) => s + (st.totalCostSold - (st.totalCostBasisSold || 0)),
      0
    );
    const otherProfit = (profitHistory || [])
      .filter(p => ['dump','referral','bonds'].includes(p.profit_type))
      .reduce((s, p) => s + (p.amount || 0), 0);
    return stocksProfit + otherProfit;
  }, [stocksForStats, profitHistory]);

  const inventoryValue = useMemo(
    () => (stocksForStats || []).reduce((s, st) => s + (st.totalCost || 0), 0),
    [stocksForStats]
  );

  const handleTabChange = (next) => {
    setActiveTab(next);
    setMountedTabs(prev => new Set(prev).add(next));
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">Analytics</h1>
          <p className="analytics-page-subtitle">Deep portfolio insights across profit, items, categories, and goals.</p>
        </div>
        <TimeframeSelector window={tf.window} options={tf.options} onChange={tf.setWindow} />
      </div>

      {current.fromFallback && (
        <div className="analytics-fallback-banner">Showing locally-computed data. Live aggregation is temporarily unavailable.</div>
      )}

      <KpiBand
        loading={current.loading}
        totalProfit={totalProfit}
        periodProfit={sumProfit(current.buckets)}
        priorPeriodProfit={sumProfit(prior.buckets)}
        gpTraded={sumGpTraded(current.buckets)}
        priorGpTraded={sumGpTraded(prior.buckets)}
        inventoryValue={inventoryValue}
        numberFormat={numberFormat}
      />

      <TabNav activeTab={activeTab} onChange={handleTabChange} />

      <div className="analytics-tab-content">
        {mountedTabs.has('profit')     && <div hidden={activeTab !== 'profit'}>     <ProfitTab     buckets={current.buckets} timeframe={tf} numberFormat={numberFormat} /></div>}
        {mountedTabs.has('items')      && <div hidden={activeTab !== 'items'}>      <ItemsTab      buckets={current.buckets} timeframe={tf} numberFormat={numberFormat} /></div>}
        {mountedTabs.has('categories') && <div hidden={activeTab !== 'categories'}> <CategoriesTab buckets={current.buckets} timeframe={tf} numberFormat={numberFormat} /></div>}
        {mountedTabs.has('goals')      && <div hidden={activeTab !== 'goals'}>      <GoalsTab      buckets={current.buckets} timeframe={tf} numberFormat={numberFormat} /></div>}
      </div>
    </div>
  );
}

function daysBetween(startIso, endIso) {
  const ms = new Date(endIso) - new Date(startIso);
  return Math.max(1, Math.round(ms / 86400000));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AnalyticsPage.jsx
git commit -m "feat(analytics): add AnalyticsPage shell"
```

---

## Phase D: Integration

### Task D1: Wire routing & nav button in `MainApp.jsx`

**Files:**
- Modify: `src/MainApp.jsx`

- [ ] **Step 1: Add import**

Near the other page imports (around lines 3–6) add:

```jsx
import AnalyticsPage from './pages/AnalyticsPage';
```

- [ ] **Step 2: Add nav button**

Locate the `📊 Graphs` nav button block in `MainApp.jsx` (around lines 966–987). Immediately after that closing `</button>` and before the Watchlist button, insert:

```jsx
<button
  onClick={() => navigateToPage('analytics')}
  style={{
    padding: '0.75rem 1.5rem',
    background: currentPage === 'analytics' ? 'rgb(168, 85, 247)' : 'transparent',
    border: 'none',
    borderRadius: '0.5rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background 0.2s',
    fontSize: '0.875rem'
  }}
  onMouseOver={(e) => {
    if (currentPage !== 'analytics') e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
  }}
  onMouseOut={(e) => {
    if (currentPage !== 'analytics') e.currentTarget.style.background = 'transparent';
  }}
>
  📈 Analytics
</button>
```

- [ ] **Step 3: Render the page**

Find the page-render switch in `MainApp.jsx` (the block with `<HomePage>`, `<HistoryPage>`, `<GraphsPage>`, `<WatchlistPage>` near lines 1120–1175). After the `<WatchlistPage>` block, add:

```jsx
{currentPage === 'analytics' && (
  <AnalyticsPage
    userId={userId}
    transactions={transactions}
    profitHistory={profitHistory}
    numberFormat={settings?.numberFormat}
    initialTab={initialTabParam}
  />
)}
```

- [ ] **Step 4: Wire `initialTabParam` from URL**

In the same `MainApp.jsx`, find where `currentPage` and other page-state are derived (search for `navigateToPage`). Add:

```jsx
const initialTabParam = useMemo(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab');
}, [currentPage]);
```

Place this near the top of the component body, after existing `useMemo` hooks.

- [ ] **Step 5: Verify routing in the browser**

Run: `npm run dev`
Open the app, click the new **📈 Analytics** nav button, expect:
- URL becomes `/analytics`
- Page shows title "Analytics", timeframe pills, KPI band with live numbers, four tab buttons, and the active tab placeholder ("Profit tab coming in Plan 2.").
- Click each tab — the placeholder text changes; URL updates `?tab=...`.
- Refresh on `/analytics?tab=items` — Items tab is active on load.

- [ ] **Step 6: Commit**

```bash
git add src/MainApp.jsx
git commit -m "feat(analytics): wire AnalyticsPage route and nav button"
```

---

## Phase E: Cleanup of legacy modals + alt timer relocation

### Task E1: Extract Alt Account Timer

**Files:**
- Create: `src/components/AltAccountTimer.jsx`

- [ ] **Step 1: Create the new component**

Copy the alt-timer JSX from `src/components/ChartButtons.jsx` (the first inner `div` block including the timer label, value, and Set/Reset buttons — lines ~32–100). Wrap it as a self-contained component:

```jsx
// src/components/AltAccountTimer.jsx
import React from 'react';

export default function AltAccountTimer({ altAccountTimer, onSetAltTimer, onResetAltTimer, currentTime }) {
  const formatTimeRemaining = (endTime) => {
    const remaining = endTime - currentTime;
    if (remaining <= 0) return 'Ready to Check!';
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isReady = altAccountTimer && altAccountTimer <= currentTime;
  const isActive = altAccountTimer && altAccountTimer > currentTime;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      background: isReady
        ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))'
        : isActive
        ? 'linear-gradient(to right, rgb(202, 138, 4), rgb(161, 98, 7))'
        : 'linear-gradient(to right, rgb(71, 85, 105), rgb(51, 65, 85))',
      borderRadius: '0.75rem',
      border: 'none',
      color: 'white',
      boxShadow: isReady
        ? '0 0 20px rgba(34, 197, 94, 0.4), 0 4px 6px rgba(0, 0, 0, 0.1)'
        : '0 4px 6px rgba(0, 0, 0, 0.1)',
      animation: isReady ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Alt Account Timer</span>
        <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
          {altAccountTimer ? formatTimeRemaining(altAccountTimer) : 'Not Set'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onSetAltTimer}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          {altAccountTimer ? '⏰ Change' : '🔔 Set Timer'}
        </button>
        {altAccountTimer && (
          <button
            onClick={onResetAltTimer}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(220, 38, 38, 0.9)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(220, 38, 38, 1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            🔄 Reset
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render in trade page header**

In `MainApp.jsx`, locate the section that renders Trade page (search for `currentPage === 'trade'` or the `CategorySection` block). Insert `<AltAccountTimer .../>` near the top of that block, above the categories. Replace the existing `<ChartButtons>` usage.

Add the import:

```jsx
import AltAccountTimer from './components/AltAccountTimer';
```

Where `<ChartButtons ... />` was rendered, replace with:

```jsx
<AltAccountTimer
  altAccountTimer={altAccountTimer}
  onSetAltTimer={handleSetAltTimer}
  onResetAltTimer={handleResetAltTimer}
  currentTime={currentTime}
/>
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Navigate to Trade page, expect: alt-timer visible at top, "View Profit Breakdown" and "Category Comparison" buttons gone.

- [ ] **Step 4: Commit**

```bash
git add src/components/AltAccountTimer.jsx src/MainApp.jsx
git commit -m "refactor: extract AltAccountTimer from ChartButtons, render on Trade page"
```

---

### Task E2: Delete legacy modals and `ChartButtons`

**Files:**
- Delete: `src/components/ChartButtons.jsx`
- Delete: `src/components/modals/ProfitChartModal.jsx`
- Delete: `src/components/modals/CategoryChartModal.jsx`
- Modify: `src/MainApp.jsx`
- Modify: `src/hooks/useModalHandlers.js`
- Modify: `src/components/ModalManager.jsx`
- Modify: `src/contexts/ModalContext.jsx`

- [ ] **Step 1: Remove imports and references in `MainApp.jsx`**

Search `MainApp.jsx` for `ChartButtons`, `ProfitChartModal`, `CategoryChartModal`, `showProfitChart`, `showCategoryChart`, `openModal('profitChart')`, `openModal('categoryChart')`. Remove every line that references these.

- [ ] **Step 2: Remove handlers in `useModalHandlers.js`**

Search for `handleShowProfitChart`, `handleShowCategoryChart`, or any functions that open `profitChart`/`categoryChart` modals. Delete them and remove from the returned object.

- [ ] **Step 3: Remove modal renders in `ModalManager.jsx`**

Search for `<ProfitChartModal`, `<CategoryChartModal`. Delete the `<ModalContainer>` wrappers around them.

- [ ] **Step 4: Remove modal names from `ModalContext.jsx`**

If the context lists modal names explicitly (e.g., a default state with `profitChart: false, categoryChart: false`), remove those keys.

- [ ] **Step 5: Delete the files**

```bash
git rm src/components/ChartButtons.jsx src/components/modals/ProfitChartModal.jsx src/components/modals/CategoryChartModal.jsx
```

- [ ] **Step 6: Verify**

Run: `npm run build`
Expected: build succeeds with no module-not-found errors.

Run: `npm run dev`
Navigate to Trade page, expect no errors in browser console. Click around (Buy, Sell, Bulk modals) — they still work.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove ChartButtons and legacy chart modals"
```

---

## Manual verification checklist

Before opening the PR, walk through:

- [ ] `/analytics` loads without console errors
- [ ] Total Profit, Period Profit, GP Traded, Inventory Value cards show real numbers
- [ ] Period Profit and GP Traded show a delta vs prior window
- [ ] Each timeframe pill (1W/1M/3M/6M/1Y/All) updates the KPI cards
- [ ] Timeframe selection persists across reload
- [ ] Each tab button navigates and updates `?tab=...` in the URL
- [ ] `/analytics?tab=items` loads with Items tab active
- [ ] On a 320px viewport: KPI cards become 2x2, tabs scroll horizontally
- [ ] Trade page shows the Alt Account Timer
- [ ] No "View Profit Breakdown" or "Category Comparison" buttons anywhere
- [ ] `npm test` passes
- [ ] `npm run build` succeeds

---

## Self-review notes

Spec coverage check:

- KPI band 4 cards (Total / Period / GP / Inventory) — ✅ Task C2/C5
- Tabs Profit/Items/Categories/Goals — ✅ Task C3/C4/C5
- Timeframe selector 1W/1M/3M/6M/1Y/All — ✅ Task C1/B1
- Bucket derivation day/week/month — ✅ Task B1
- RPC `get_analytics_buckets` — ✅ Task A2
- Fallback aggregator — ✅ Task B2
- Routing `/analytics` + `?tab=` — ✅ Task D1/C5
- Delete `ChartButtons`, two modals — ✅ Task E2
- Relocate Alt Account Timer — ✅ Task E1
- Empty states / fallback banner — ✅ Task C5 (banner) and tab placeholders
- Mobile responsive — ✅ Task C1 stylesheet

Items deferred to Plans 2–5:
- All widget content for Profit / Items / Categories / Goals tabs.

Open question still in spec ("Inventory snapshot for KPI delta"): not exercised yet because the KPI uses *current* inventory value with no delta in this plan. If a delta is added later, the implementation will need a window-start snapshot calculation.
