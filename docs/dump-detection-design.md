# Dump Detection Feature - Design Document

## 1. Problem Statement

OSRS Grand Exchange items regularly experience price dumps (sudden drops in price due to supply shocks). Players who detect these dumps quickly can buy at the dipped price and sell at the recovered price for profit. Several tools (notably the Omega Discord bot) already serve this niche. This feature brings dump detection directly into OSRS Profit Tracker, giving users an integrated experience without needing external Discord bots.

## 2. Competitive Landscape

### Competitor Comparison

| Feature | Omega (Discord) | OSRS Dumps (Web + Discord) | GE Tracker | Flopper (Discord) | Our Plan |
|---|---|---|---|---|---|
| **Platform** | Discord only | Website + Discord | Website + Mobile app | Discord only | Integrated in-app |
| **Pricing** | Free (delayed) + Donor (realtime) | Free (30s delay) + $2.99/mo (realtime) | Free (limited) + Premium | Free | Free (for now) |
| **Polling speed** | ~1 request/second | Unknown | Every 10 minutes | Unknown | ~1 request/second |
| **Severity tiers** | Yes (profit-per-limit) | Yes (filtered channels) | No (just alerts) | No | Yes |
| **1gp detection** | Yes | Yes | No | No | Yes |
| **Slowbuy detection** | Yes | No | No | No | Phase 4 |
| **Inline charts** | Yes | No | Yes | Yes | Yes (on-demand) |
| **Profit calculation** | Yes (realistic + max) | Yes (with tax) | Basic margin | Basic margin | Yes (realistic, taxed) |
| **Notifications** | Discord pings | Discord pings | Email/SMS/Push | Discord DM | In-app sound + browser push |

### Omega Bot (Primary Competitor)

Omega is a Discord bot that detects GE price dumps and posts alerts to categorized channels:

| Channel | Filter | Profit Per Limit |
|---|---|---|
| All | No filter, includes both insta-buy and insta-sell dumps | Any |
| Good | Statistical filtering, higher confidence | ~200k-400k |
| Very Good | Stricter filters | ~400k-800k |
| Mega | Stricter still | ~800k-1.6M |
| Omega-mega (donors only) | Premium tier | ~1.6M-5M |
| Super-mega-omega (donors only) | Premium tier | ~5M+ |
| 1gp | Items dumped to 1gp | Risk-free |
| Good-to-slowbuy | Insta-sell price dips (margin widening) | Varies |

Donor channels get realtime access; free channels are delayed.

**Technical intel from Omega developer:**
- Polls the Wiki API "just over once every second"
- Stores all price data in SQLite
- Recommends Postgres + TimescaleDB for larger-scale storage
- Wiki API team doesn't rate limit but will reach out if you poll too aggressively

### What Omega Shows Per Alert

- Item name + icon
- Severity classification (Dump, Mega Dump, etc.)
- IB/IS Volume and GE buy limit
- Max Profit: buy at dump price, sell at insta-sell (optimistic)
- Realistic Profit: buy at dump price, sell at 6h average (conservative)
- Price history: 7d, 24h, 12h, 6h, 1h, Previous
- Insta Buy/Sell prices with timestamps ("15 minuten geleden")
- Cost per limit (dump price * GE limit)
- Profit per item with ROI %
- Inline price chart (24h with average line marked)

### OSRS Dumps (osrsdumps.com)

- Web-based + Discord integration
- Free tier has 30-second delay on alerts
- Premium ($2.99/mo) gets realtime alerts + filtered channels + beta features
- Also offers: herb cleaning profits, crushing secondaries, high alchemy suggestions
- No public documentation on detection algorithm

### Other Tools

- **GE Tracker:** 740k+ users. Paid premium for full features. 10-minute price snapshots (much slower than Omega). Email/SMS/push alerts on user-defined price thresholds.
- **Flopper:** Free Discord bot. Price lookups, margin analysis, overnight flipping data. No dedicated dump detection.
- **osrs-flipper (open source, C#):** Filter-based anomaly detection on Wiki API. Generates dynamic graphs. No published thresholds.
- **osrsmarketscanner (open source, Go):** Discord bot with GE lookup + configurable market scanning. Settings-driven but undocumented algorithm.
- **GE Margin (gemargin.com):** Discord-based price alerts when items hit user-defined target prices.
- **Runeberg Terminal:** Algorithmic monitoring with conservative after-tax profit estimates. 5-minute updates for active items, 1-hour for inactive.

### Monetization Patterns

Both Omega and OSRS Dumps gate **speed** behind a paywall. Free users get delayed alerts (30s for OSRS Dumps). Donor/premium users get realtime. Not implementing premium tiers for now, but this is a natural monetization path since infrastructure cost stays the same regardless of user count.

## 3. Why Dumps Happen (Market Mechanics)

The OSRS Grand Exchange has a structural bias toward price dips:

- **Buy limits** restrict demand: each player can only buy X of an item per 4 hours
- **No sell limits**: players can dump unlimited quantity instantly
- This asymmetry means downward price pressure faces no restrictions, while upward pressure is capped

Common dump triggers:
- Player quitting and liquidating bank
- Bot farms dumping farmed resources (most common: raw fish, logs, ore, herbs, runes)
- Content creators causing panic sells
- Game updates changing item utility
- Merch clan manipulation

Most dumps are temporary. Prices recover to near the pre-dump average within hours to days because demand catches up once the excess supply is absorbed (buy limits throttle recovery speed).

### Timing Patterns

- **Bot farm dumps** happen most during off-peak hours (overnight GMT) when bots have accumulated resources and fewer real players are buying
- Items with low GE buy limits recover slower (demand is throttled harder)
- Recurring dumps on the same item at the same time of day are common (PoignantTech documented Zulrah's scales dipping 10-15% every evening for over a month)

### The 1gp Mechanic

When someone sets a sell offer at 1gp, they don't actually receive 1gp. The GE matches their offer with the highest existing buy order. But the `/latest` API reports the sell offer price (1gp), making it look like the item is worthless. These are essentially risk-free buys: place a buy offer at any reasonable price and the GE will fill it. The item is clearly far below actual value. Omega has a dedicated channel for this. We should detect these as a separate category.

## 4. Data Source: OSRS Wiki Real-Time Prices API

**Base URL:** `https://prices.runescape.wiki/api/v1/osrs`

All endpoints are free, unauthenticated, and have no explicit rate limit. A descriptive `User-Agent` header is required.

### Endpoints

| Endpoint | Parameters | Returns | Update Frequency |
|---|---|---|---|
| `/latest` | `id` (optional) | `{ high, highTime, low, lowTime }` per item | Real-time (per transaction) |
| `/mapping` | none | Item metadata: name, id, examine, members, limits, icon | Static |
| `/5m` | `timestamp` (optional) | 5-min avg high/low + volume per item | Every 5 minutes |
| `/1h` | `timestamp` (optional) | 1-hour avg high/low + volume per item | Every hour |
| `/timeseries` | `id` (required), `timestep` (5m/1h/6h/24h) | Historical prices, max 365 data points | On request |

### Key Constraints

- `/latest` returns all ~3,700 items in one request (preferred over per-item calls)
- `/timeseries` is per-item only. Fetching history for all items = 3,700 requests. Not viable for repeated polling.
- No WebSocket/push support. Must poll.
- Blocked default user-agents: `python-requests`, `Python-urllib`, `Apache-HttpClient`, `RestSharp`, `Java`, bare `curl`

### Rate Limit Reality

The Wiki API has no explicit rate limit. The Omega developer confirmed they poll "just over once every second" without issues. The Wiki team's stance: they won't block you proactively, but will reach out if your usage threatens API stability. A single caller doing 1 req/second (~86,400/day) is well within acceptable bounds with a proper User-Agent.

### What We Already Use

The app currently calls `/latest` every 60 seconds and `/mapping` on load via `useGEPrices.js`. The dump detection worker would be a separate server-side consumer of the same API.

## 5. Architecture

### Overview

Two hosting options are documented. Both share the same detection algorithm, database schema, and client integration. They differ in polling speed, cost, and complexity.

### Option A: Supabase pg_cron + Edge Function (Recommended Start)

**Cost: $0. Polling: every 6 seconds. Zero new infrastructure.**

```
+-------------------+       +-------------------+       +------------------+
|  Supabase         |       |  OSRS Wiki API    |       |  Browser Client  |
|  pg_cron (6s)     |------>|  /latest           |       |                  |
|        |          |       |  /5m (every 5min) |       |  Supabase        |
|        v          |       +-------------------+       |  Realtime sub    |
|  Edge Function    |                                    |  on dump_alerts  |
|  - fetch prices   |                                    |        |         |
|  - read EMA blob  |                                    |        v         |
|  - compute EMAs   |                                    |  Notification    |
|  - detect dumps   |                                    |  + Dump Page     |
|  - write EMA blob |                                    |                  |
|  - write alerts   |                                    +------------------+
+-------------------+                                             ^
        |                                                         |
        |              +-------------------+                      |
        +------------->|  Supabase Tables  |<---------------------+
                       |  - ema_state (1)  |
                       |  - dump_alerts    |
                       |  - dump_settings  |
                       +-------------------+
```

**How it works:**

Edge Functions are stateless (no memory between invocations), so EMAs can't live in memory. Instead, all 3,700 items' EMAs are stored as a **single JSONB blob** in one database row (`ema_state` table). Each invocation:

1. Fetch `/latest` from Wiki API (~200ms)
2. Read 1 row from `ema_state` containing the full JSONB blob (~185KB, ~50ms)
3. Parse JSON, iterate 3,700 items, update EMAs + std devs, run detection (~100ms CPU)
4. Write updated blob back to `ema_state` (~50ms)
5. Write any new/updated dump alerts (~50ms per dump)

**Why 6 seconds (not 5):**
- 5 seconds = 518,400 invocations/month (exceeds 500k free tier limit)
- 6 seconds = 432,000 invocations/month (86% of limit, leaves headroom)
- Still faster than GE Tracker (10min), OSRS Dumps free tier (30s delay), and most competitors
- 6x slower than Omega (1s). Acceptable tradeoff for $0 cost.

**Additional table for Option A:**

```sql
-- Single row storing all EMA state as JSONB
CREATE TABLE ema_state (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- enforce single row
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  volume_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB structure for 'data':
-- {
--   "2": { "ema1h": 185, "ema6h": 183, "ema24h": 184, "var24h": 100, "stdDev24h": 10, "lastHigh": 180, "lastLow": 178, "lastHighTime": 1712345678, "initTime": 1712340000 },
--   "6": { ... },
--   ...
-- }
-- ~50 bytes per item * 3,700 items = ~185 KB

-- JSONB structure for 'volume_data':
-- {
--   "2": { "vol5m": 1523 },
--   ...
-- }
-- ~20 bytes per item * 3,700 items = ~74 KB
```

**Size:** ~260 KB (one row). Negligible.

**pg_cron setup:**

```sql
-- Main detection loop (every 6 seconds)
SELECT cron.schedule(
  'detect-dumps',
  '6 seconds',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/detect-dumps',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <service-role-key>',
      'Content-Type', 'application/json'
    ),
    body := '{"type":"prices"}'::jsonb
  ) AS request_id;
  $$
);

-- Volume update (every 5 minutes)
SELECT cron.schedule(
  'update-volume',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/detect-dumps',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <service-role-key>',
      'Content-Type', 'application/json'
    ),
    body := '{"type":"volume"}'::jsonb
  ) AS request_id;
  $$
);
```

**Edge Function pseudocode (Option A):**

```typescript
// supabase/functions/detect-dumps/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const WIKI_API = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker-DumpDetector - osrsprofittracker@gmail.com';

const ALPHA_1H  = 2 / (600 + 1);    // 600 six-second periods in 1h
const ALPHA_6H  = 2 / (3600 + 1);   // 3,600 six-second periods in 6h
const ALPHA_24H = 2 / (14400 + 1);  // 14,400 six-second periods in 24h

Deno.serve(async (req) => {
  const { type } = await req.json();
  
  if (type === 'volume') {
    // Fetch 5m volume data and store in ema_state.volume_data
    const res = await fetch(`${WIKI_API}/5m`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    const json = await res.json();
    const volumeData = {};
    for (const [id, d] of Object.entries(json.data)) {
      volumeData[id] = { vol5m: (d.highPriceVolume || 0) + (d.lowPriceVolume || 0) };
    }
    await supabase.from('ema_state').update({ 
      volume_data: volumeData, 
      updated_at: new Date().toISOString() 
    }).eq('id', 1);
    return new Response('OK');
  }
  
  // type === 'prices'
  // 1. Fetch latest prices
  const priceRes = await fetch(`${WIKI_API}/latest`, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const latest = await priceRes.json();
  
  // 2. Read EMA state (single row, single JSONB blob)
  const { data: stateRow } = await supabase
    .from('ema_state')
    .select('data, volume_data')
    .eq('id', 1)
    .single();
  
  const emaData = stateRow?.data || {};
  const volumeData = stateRow?.volume_data || {};
  const now = Math.floor(Date.now() / 1000);
  const dumps = [];
  
  // 3. Process each item
  for (const [itemId, price] of Object.entries(latest.data)) {
    const current = price.high;
    if (!current || current <= 0) continue;
    if (price.highTime && (now - price.highTime) > 300) continue;
    
    const existing = emaData[itemId];
    
    if (!existing) {
      emaData[itemId] = {
        ema1h: current, ema6h: current, ema24h: current,
        var24h: 0, stdDev24h: 0,
        lastHigh: current, lastLow: price.low,
        lastHighTime: price.highTime,
        initTime: now
      };
      continue;
    }
    
    // Skip if price unchanged
    if (current === existing.lastHigh && price.low === existing.lastLow) continue;
    
    // Update EMAs
    existing.ema1h  = ALPHA_1H  * current + (1 - ALPHA_1H)  * existing.ema1h;
    existing.ema6h  = ALPHA_6H  * current + (1 - ALPHA_6H)  * existing.ema6h;
    existing.ema24h = ALPHA_24H * current + (1 - ALPHA_24H) * existing.ema24h;
    
    // Update Welford's running std dev
    const diff = current - existing.ema24h;
    existing.var24h = (1 - ALPHA_24H) * (existing.var24h + ALPHA_24H * diff * diff);
    existing.stdDev24h = Math.sqrt(existing.var24h);
    
    existing.lastHigh = current;
    existing.lastLow = price.low;
    existing.lastHighTime = price.highTime;
    
    // Skip warmup (need at least 1h of data = 600 cycles at 6s)
    if ((now - existing.initTime) < 3600) continue;
    
    // Skip junk
    if (existing.ema24h < 1000) continue;
    
    // Z-score
    const zScore = existing.stdDev24h > 0
      ? (existing.ema24h - current) / existing.stdDev24h
      : 0;
    
    const is1gp = current <= 1;
    if (zScore < 2.0 && !is1gp) continue;
    
    // Volume filter
    const vol = volumeData[itemId];
    if (!is1gp && (!vol || vol.vol5m < 1)) continue;
    
    // ... profit calculation + severity classification same as Section 6 ...
    // ... push to dumps array ...
  }
  
  // 4. Write updated EMA blob back (single row update)
  await supabase.from('ema_state').update({ 
    data: emaData, 
    updated_at: new Date().toISOString() 
  }).eq('id', 1);
  
  // 5. Write dump alerts (only if any detected)
  // ... same upsert logic as Section 6 step 5 ...
  
  return new Response('OK');
});
```

### Option B: Oracle Cloud Free Tier VM (Future Upgrade)

**Cost: $0 (permanently free, not a trial). Polling: every 1 second. More setup required.**

```
+------------------+       +-------------------+       +------------------+
|  Oracle Cloud VM |       |  OSRS Wiki API    |       |  Browser Client  |
|  (always-on)     |------>|  /latest (1/sec)  |       |                  |
|                  |       |  /5m (every 5min) |       |  Supabase        |
|  In-memory:      |       +-------------------+       |  Realtime sub    |
|  - EMAs          |                                    |  on dump_alerts  |
|  - Std devs      |                                    |        |         |
|  - Volume cache  |                                    |        v         |
|                  |                                    |  Notification    |
|  On dump:        |                                    |  + Dump Page     |
|  -> write to     |                                    |                  |
|     Supabase     |                                    +------------------+
+------------------+                                             ^
        |                                                        |
        |              +------------------+                      |
        +------------->|  Supabase Tables |<---------------------+
                       |  - dump_alerts   |
                       |  - dump_settings |
                       +------------------+
```

Oracle Cloud's Always Free Tier provides permanently free ARM-based VMs:
- Up to 4 Ampere A1 cores, 24 GB RAM (can split into up to 4 VMs)
- 200 GB block storage
- 10 TB/month outbound bandwidth
- A tiny Node.js worker needs 1 core, 1 GB RAM at most

**Why this is the speed option:**

| Concern | Option A (Edge Function) | Option B (Oracle VM) |
|---|---|---|
| **Polling interval** | 6 seconds | 1 second |
| **State** | JSONB blob in DB (read/write per cycle) | True in-memory (no DB reads per cycle) |
| **DB load per cycle** | 1 read + 1 write (~260KB each) | 0 (only writes on dump events) |
| **Cold start** | Each invocation, but fast (~50ms) | None (process stays warm) |
| **Cost** | $0 | $0 |
| **Setup complexity** | Zero (already have Supabase) | Medium (Oracle account, VM provision, SSH, pm2, OS updates) |
| **Matches Omega speed** | No (6x slower) | Yes |

**Setup required for Option B:**
1. Create Oracle Cloud account (requires credit card for verification, not charged)
2. Provision ARM VM (1 OCPU, 6 GB RAM is the smallest free config)
3. SSH into VM, install Node.js 20+
4. Clone worker repo, `npm install`
5. Set up pm2 (process manager) for auto-restart
6. Configure firewall (outbound only, no inbound needed)
7. Set environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)

**Worker code for Option B** is the same as the pseudocode in Section 8, with in-memory state and `setInterval` loops. No `ema_state` table needed.

### Comparison Summary

| Aspect | Option A: Edge Function | Option B: Oracle VM |
|---|---|---|
| **Cost** | $0 | $0 |
| **Speed** | Every 6 seconds | Every 1 second |
| **vs Omega** | 6x slower | Equal |
| **vs OSRS Dumps free** | 5x faster | 30x faster |
| **vs GE Tracker** | 100x faster | 600x faster |
| **Setup time** | Minutes | Hours |
| **Maintenance** | Zero | OS updates, monitoring |
| **Risk** | Supabase free tier limits | Oracle account management, VM uptime |
| **Migration path** | Start here, move to B if speed matters | Final destination |

**Recommendation:** Start with Option A. It's instant to set up, costs nothing, and beats most competitors on speed. If users report that 6-second detection isn't fast enough compared to Omega, migrate to Option B. The detection algorithm, database schema, and client code are identical between options; only the hosting and state management differ.

### Polling Strategy

Both options run two polling loops:

1. **`/latest` at primary interval (6s or 1s):** Fetches current insta-buy/sell prices for all items. Updates EMAs and standard deviations. Runs dump detection.
2. **`/5m` every 5 minutes:** Fetches 5-minute volume data. Updates volume cache used for false positive filtering.

**API calls per day:**

| | Option A (6s) | Option B (1s) |
|---|---|---|
| `/latest` calls | 14,400 | 86,400 |
| `/5m` calls | 288 | 288 |
| Total | 14,688 | 86,688 |

Both are well within the Wiki API's tolerance. Omega polls at 1/sec without issues.

## 6. Detection Algorithm

### False Positive Filtering

This is the hardest problem. Every competitor struggles with it. Three main sources of false positives and how to handle them:

**1. Stale prices (item hasn't traded recently):**
An item's `highTime` is from 2 hours ago. The price hasn't dropped; it just hasn't updated. If we compare a stale price against a 24h EMA that has been drifting, it can look like a dump.
- **Filter:** Only consider items where `highTime` is within the last 5 minutes.

**2. Low-volume items (one trade looks like a crash):**
Someone sells 1 Armadyl Godsword at a bad price. The API shows a low `high` value, but it's a single transaction, not a market-wide dump.
- **Filter:** Require minimum volume from the `/5m` endpoint. If fewer than X items traded in the last 5 minutes, skip.

**3. Natural volatility (volatile items trigger constantly):**
A fixed 5% threshold catches items that swing 10% daily as normal behavior. Bandos Tassets might fluctuate 3%, while Zulrah's Scales swing 15%. A flat threshold either misses dumps on stable items or floods alerts with volatile ones.
- **Filter:** Use z-scores instead of flat percentages. A z-score measures how many standard deviations the current price is below the mean. An item that naturally swings a lot has a high standard deviation, so a 10% drop might only be z=1.5 (normal). A stable item dropping 5% might be z=3.0 (significant).

```
z_score = (ema_24h - current_price) / std_dev_24h

z > 2.0 → candidate for dump detection
z > 3.0 → high confidence dump
```

### Running Standard Deviation (Welford's Algorithm)

To compute standard deviation without storing raw history, we use Welford's online algorithm alongside the EMA:

```
On each new price:
  diff = price - mean
  mean = mean + alpha * diff           // same as EMA update
  variance = (1 - alpha) * (variance + alpha * diff * diff)
  std_dev = sqrt(variance)
```

This gives us a rolling standard deviation that updates incrementally, same as the EMA. One extra field per item in memory.

### Step-by-Step (Per Poll Cycle)

```
1. FETCH
   GET https://prices.runescape.wiki/api/v1/osrs/latest
   -> { data: { "ItemId": { high, highTime, low, lowTime }, ... } }

2. FOR EACH item:
   a. Skip if highTime is stale (> 5 minutes ago)
   b. Skip if price unchanged since last cycle (optimization)
   
   c. Update EMAs using exponential moving average:
      EMA_new = alpha * current_price + (1 - alpha) * EMA_old
      
      Where alpha = 2 / (N + 1), N = number of poll cycles in the time window:
      
      Option A (6-second polling):
      - 1h EMA:  N = 600,   alpha = 0.00333
      - 6h EMA:  N = 3600,  alpha = 0.000555
      - 24h EMA: N = 14400, alpha = 0.000139
      
      Option B (1-second polling):
      - 1h EMA:  N = 3600,  alpha = 0.000555
      - 6h EMA:  N = 21600, alpha = 0.0000926
      - 24h EMA: N = 86400, alpha = 0.0000231
      
   d. Update running standard deviation (Welford's):
      diff = current_price - ema_24h
      variance = (1 - alpha_24h) * (variance + alpha_24h * diff * diff)
      std_dev = sqrt(variance)
      
   e. Compute z-score:
      z_score = (ema_24h - current_price) / std_dev_24h
      (only if std_dev > 0 and EMAs have warmed up)
      
   f. Compute drop percentage (for display, not filtering):
      drop_pct = (ema_24h - current_price) / ema_24h * 100

3. DUMP DETECTION FILTERS:
   - z_score > 2.0                              (statistically significant drop)
   - OR current_price <= 1                       (1gp special case)
   - AND ema_24h > 1000 gp                      (skip junk items)
   - AND highTime within last 5 minutes          (not stale data)
   - AND 5m_volume > minimum threshold           (actively traded)

4. FOR EACH detected dump:
   a. Look up GE buy limit from mapping data (cached in memory)
   b. Calculate profit metrics:
      - ge_tax = min(floor(ema_6h * 0.02), 5_000_000)  (2% capped at 5M)
      - realistic_sell = ema_6h  (conservative: sell at 6h average)
      - profit_per_item = realistic_sell - ge_tax - current_insta_buy
      - cost_per_limit = current_insta_buy * ge_limit
      - total_profit = profit_per_item * ge_limit
      - roi_pct = (total_profit / cost_per_limit) * 100
      
   c. Classify severity (by profit per limit):
      - "dip":       total_profit < 200,000
      - "good":      200,000 - 400,000
      - "very_good": 400,000 - 800,000
      - "mega":      800,000 - 1,600,000
      - "omega":     1,600,000 - 5,000,000
      - "super":     5,000,000+
      
   d. Special case: if current_insta_buy <= 1, classify as "1gp"

5. WRITE TO SUPABASE (only when dump detected/updated/resolved):
   - New dump: INSERT into dump_alerts
   - Existing active dump: UPDATE price/profit/severity
   - Price recovered (z_score < 1.0): set resolved_at
   
   Note: Supabase writes happen only on state changes, not every cycle.
   Typical: a few writes per hour during quiet periods, more during active dumps.
```

### Exponential Moving Average (EMA) Explained

Instead of storing thousands of historical price snapshots and computing `AVG()`, an EMA maintains a single running value per item that approximates the average. Each new price nudges the average slightly:

```
EMA = alpha * new_price + (1 - alpha) * old_EMA
```

- `alpha` close to 0 = slow-moving average (24h)
- `alpha` close to 1 = fast-moving average (responds quickly)

This means:
- No raw price history needed in the database
- One value per time window per item, updated in place
- Mathematically equivalent to a weighted average that gives more weight to recent prices

**Cold start behavior:** When the worker first starts, there are no existing EMAs. Initialize all EMAs to the first price seen. The 1h EMA will be accurate within ~1 hour, the 24h EMA within ~24 hours. During this warmup period, dump detection will produce false positives, so detection is disabled until EMAs have accumulated at least 1 hour of data. This is a one-time cost per restart.

### Slowbuy Detection (Future Enhancement)

Similar to Omega's "good-to-slowbuy" channel: detect when the insta-sell price drops significantly below the insta-buy, indicating a widening margin. This would use `latest.low` instead of `latest.high` for the comparison. The margin is: `high - low`. When this margin is significantly wider than its historical average (z-score on margin width), flag as a slowbuy opportunity.

## 7. Database Schema

**Option A:** EMAs are stored as a JSONB blob in `ema_state` (see Section 5). Read and written every 6 seconds by the Edge Function.

**Option B:** EMAs live in-memory on the VM. No `ema_state` table needed. Database is only touched when a dump is detected, updated, or resolved (a few times per hour).

### Table: `dump_alerts`

Stores detected dump events. Active dumps have `resolved_at = NULL`.

```sql
CREATE TABLE dump_alerts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id         INTEGER NOT NULL,
  item_name       TEXT NOT NULL,
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,            -- NULL = still active
  
  -- Prices at detection
  insta_buy       INTEGER NOT NULL,       -- price at dump detection
  insta_sell      INTEGER,                -- sell price at detection
  
  -- Averages at detection  
  ema_1h          NUMERIC NOT NULL,
  ema_6h          NUMERIC NOT NULL,
  ema_24h         NUMERIC NOT NULL,
  
  -- Statistical context
  z_score         NUMERIC NOT NULL,       -- standard deviations below mean
  std_dev_24h     NUMERIC,                -- item's 24h price std deviation
  volume_5m       INTEGER,                -- 5-minute trading volume at detection
  
  -- Computed metrics
  drop_pct        NUMERIC NOT NULL,       -- % below 24h average
  profit_per_item INTEGER,                -- realistic profit per item
  cost_per_limit  BIGINT,                 -- cost to buy one full limit
  total_profit    BIGINT,                 -- profit if you buy full limit
  roi_pct         NUMERIC,               -- return on investment %
  ge_limit        INTEGER,               -- GE buy limit for reference
  
  -- Classification
  severity        TEXT NOT NULL,          -- dip, good, very_good, mega, omega, super, 1gp
  
  -- For real-time updates while dump is active
  current_price   INTEGER,               -- updated each cycle while active
  peak_drop_pct   NUMERIC,               -- worst drop observed
  peak_z_score    NUMERIC,               -- highest z-score observed
  
  CONSTRAINT valid_severity CHECK (severity IN ('dip','good','very_good','mega','omega','super','1gp'))
);

-- Indexes
CREATE INDEX idx_dump_alerts_active ON dump_alerts (resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_dump_alerts_severity ON dump_alerts (severity, detected_at DESC);
CREATE INDEX idx_dump_alerts_item ON dump_alerts (item_id, detected_at DESC);
```

**Size:** ~200 alerts/day * 250 bytes * 30 days retention = ~1.5 MB/month

### Table: `dump_settings`

Per-user notification preferences for dump alerts.

```sql
CREATE TABLE dump_settings (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id),
  enabled           BOOLEAN DEFAULT TRUE,
  min_severity      TEXT DEFAULT 'good',    -- minimum severity to notify
  min_profit        INTEGER DEFAULT 200000, -- minimum profit per limit
  min_price         INTEGER DEFAULT 1000,   -- minimum item avg price
  notify_sound      BOOLEAN DEFAULT TRUE,
  notify_browser    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Realtime

Enable Supabase Realtime on `dump_alerts` for `INSERT` and `UPDATE` events. Clients subscribe and fire notifications when new dumps appear matching their `dump_settings` preferences.

### Total Storage Impact

| Table | Rows | Size |
|---|---|---|
| `dump_alerts` (30-day retention) | ~6,000 | ~1.5 MB |
| `dump_settings` | 1 per user | Negligible |
| **Total** | | **~1.5 MB** |

Supabase free tier limit: **500 MB**. This feature uses **~0.3%** of available storage.

A cleanup job (pg_cron, daily) should delete resolved alerts older than 30 days:
```sql
SELECT cron.schedule(
  'cleanup-old-dumps',
  '0 3 * * *',  -- daily at 3 AM UTC
  $$DELETE FROM dump_alerts WHERE resolved_at IS NOT NULL AND resolved_at < NOW() - INTERVAL '30 days'$$
);
```

## 8. Worker Implementation (Option B Only)

Option A's implementation is the Edge Function shown in Section 5. This section covers the standalone worker for Option B (Oracle Cloud VM).

### Project Structure

```
dump-worker/
  package.json
  src/
    index.js          -- entry point, main loop
    poller.js         -- fetches /latest and /5m
    ema.js            -- EMA + Welford std dev calculations
    detector.js       -- dump detection logic + severity classification
    supabase.js       -- Supabase client, writes dump_alerts
    config.js         -- thresholds, alpha values, API URLs
```

### Main Loop (Pseudocode)

```javascript
// index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const USER_AGENT = 'OSRSProfitTracker-DumpDetector - osrsprofittracker@gmail.com';

// In-memory state (not needed for Option A, which uses JSONB blob)
const items = new Map();  // itemId -> { ema1h, ema6h, ema24h, variance24h, stdDev24h, lastHigh, lastLow, ... }
const volumeCache = new Map();  // itemId -> { volume5m }
let mappingData = new Map();  // itemId -> { name, limit, icon }
let warmedUp = false;
let startTime = Date.now();

// Alpha values for 1-second polling (Option B)
// For Option A (6s), see Section 5
const ALPHA_1H  = 2 / (3600 + 1);
const ALPHA_6H  = 2 / (21600 + 1);
const ALPHA_24H = 2 / (86400 + 1);

// --- Initialization ---
async function init() {
  // Fetch item mapping (once)
  const res = await fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', {
    headers: { 'User-Agent': USER_AGENT }
  });
  const data = await res.json();
  for (const item of data) {
    mappingData.set(item.id, { name: item.name, limit: item.limit, icon: item.icon });
  }
  console.log(`Loaded ${mappingData.size} items from mapping`);
}

// --- Price polling (every ~1 second) ---
async function pollPrices() {
  const res = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
    headers: { 'User-Agent': USER_AGENT }
  });
  const json = await res.json();
  const now = Math.floor(Date.now() / 1000);
  const dumps = [];
  
  for (const [itemId, price] of Object.entries(json.data)) {
    const id = Number(itemId);
    const current = price.high;
    if (!current || current <= 0) continue;
    
    // Stale data check: skip if last trade was > 5 minutes ago
    if (price.highTime && (now - price.highTime) > 300) continue;
    
    const existing = items.get(id);
    
    if (!existing) {
      // Initialize
      items.set(id, {
        ema1h: current, ema6h: current, ema24h: current,
        variance24h: 0, stdDev24h: 0,
        lastHigh: current, lastLow: price.low,
        lastHighTime: price.highTime, lastLowTime: price.lowTime,
        initTime: Date.now()
      });
      continue;
    }
    
    // Skip if price unchanged (optimization)
    if (current === existing.lastHigh && price.low === existing.lastLow) continue;
    
    // Update EMAs
    existing.ema1h  = ALPHA_1H  * current + (1 - ALPHA_1H)  * existing.ema1h;
    existing.ema6h  = ALPHA_6H  * current + (1 - ALPHA_6H)  * existing.ema6h;
    existing.ema24h = ALPHA_24H * current + (1 - ALPHA_24H) * existing.ema24h;
    
    // Update running standard deviation (Welford's)
    const diff = current - existing.ema24h;
    existing.variance24h = (1 - ALPHA_24H) * (existing.variance24h + ALPHA_24H * diff * diff);
    existing.stdDev24h = Math.sqrt(existing.variance24h);
    
    existing.lastHigh = current;
    existing.lastLow = price.low;
    existing.lastHighTime = price.highTime;
    existing.lastLowTime = price.lowTime;
    
    // Skip dump detection during warmup (first hour)
    if (!warmedUp) continue;
    
    // Skip junk items
    if (existing.ema24h < 1000) continue;
    
    // Z-score check
    const zScore = existing.stdDev24h > 0 
      ? (existing.ema24h - current) / existing.stdDev24h 
      : 0;
    
    const is1gp = current <= 1;
    
    if (zScore < 2.0 && !is1gp) continue;
    
    // Volume filter
    const vol = volumeCache.get(id);
    if (!is1gp && (!vol || vol.volume5m < 1)) continue;
    
    // Calculate profit
    const mapping = mappingData.get(id);
    const geLimit = mapping?.limit || 1;
    const geTax = Math.min(Math.floor(existing.ema6h * 0.02), 5000000);
    const profitPerItem = Math.floor(existing.ema6h - geTax - current);
    const costPerLimit = current * geLimit;
    const totalProfit = profitPerItem * geLimit;
    const roiPct = costPerLimit > 0 ? (totalProfit / costPerLimit) * 100 : 0;
    
    // Severity classification
    let severity;
    if (is1gp)                       severity = '1gp';
    else if (totalProfit >= 5000000) severity = 'super';
    else if (totalProfit >= 1600000) severity = 'omega';
    else if (totalProfit >= 800000)  severity = 'mega';
    else if (totalProfit >= 400000)  severity = 'very_good';
    else if (totalProfit >= 200000)  severity = 'good';
    else                             severity = 'dip';
    
    dumps.push({
      item_id: id,
      item_name: mapping?.name || `Item ${id}`,
      insta_buy: current,
      insta_sell: price.low,
      ema_1h: Math.round(existing.ema1h),
      ema_6h: Math.round(existing.ema6h),
      ema_24h: Math.round(existing.ema24h),
      z_score: Math.round(zScore * 100) / 100,
      std_dev_24h: Math.round(existing.stdDev24h),
      volume_5m: vol?.volume5m || 0,
      drop_pct: Math.round(((existing.ema24h - current) / existing.ema24h) * 10000) / 100,
      profit_per_item: profitPerItem,
      cost_per_limit: costPerLimit,
      total_profit: totalProfit,
      roi_pct: Math.round(roiPct * 100) / 100,
      ge_limit: geLimit,
      severity,
      current_price: current,
      peak_drop_pct: Math.round(((existing.ema24h - current) / existing.ema24h) * 10000) / 100,
      peak_z_score: Math.round(zScore * 100) / 100
    });
  }
  
  // Write dumps to Supabase (only on detection, not every cycle)
  if (dumps.length > 0) {
    await writeDumps(dumps);
  }
  
  // Resolve recovered items
  await resolveRecovered();
}

// --- Volume polling (every 5 minutes) ---
async function pollVolume() {
  const res = await fetch('https://prices.runescape.wiki/api/v1/osrs/5m', {
    headers: { 'User-Agent': USER_AGENT }
  });
  const json = await res.json();
  for (const [itemId, data] of Object.entries(json.data)) {
    volumeCache.set(Number(itemId), {
      volume5m: (data.highPriceVolume || 0) + (data.lowPriceVolume || 0)
    });
  }
}

// --- Supabase writes ---
async function writeDumps(dumps) {
  for (const dump of dumps) {
    const { data: existing } = await supabase
      .from('dump_alerts')
      .select('id, peak_drop_pct, peak_z_score')
      .eq('item_id', dump.item_id)
      .is('resolved_at', null)
      .single();
    
    if (existing) {
      await supabase.from('dump_alerts').update({
        current_price: dump.current_price,
        drop_pct: dump.drop_pct,
        z_score: dump.z_score,
        peak_drop_pct: Math.max(existing.peak_drop_pct, dump.drop_pct),
        peak_z_score: Math.max(existing.peak_z_score, dump.z_score),
        profit_per_item: dump.profit_per_item,
        total_profit: dump.total_profit,
        severity: dump.severity
      }).eq('id', existing.id);
    } else {
      await supabase.from('dump_alerts').insert(dump);
    }
  }
}

async function resolveRecovered() {
  // Get all active alerts
  const { data: active } = await supabase
    .from('dump_alerts')
    .select('id, item_id')
    .is('resolved_at', null);
  
  if (!active) return;
  
  for (const alert of active) {
    const item = items.get(alert.item_id);
    if (!item || item.stdDev24h === 0) continue;
    
    const zScore = (item.ema24h - item.lastHigh) / item.stdDev24h;
    if (zScore < 1.0) {
      // Price recovered to within 1 std dev of mean
      await supabase.from('dump_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alert.id);
    }
  }
}

// --- Main ---
async function main() {
  await init();
  
  // Start price polling (every ~1 second)
  setInterval(async () => {
    try { await pollPrices(); }
    catch (e) { console.error('Price poll error:', e.message); }
  }, 1000);
  
  // Start volume polling (every 5 minutes)
  setInterval(async () => {
    try { await pollVolume(); }
    catch (e) { console.error('Volume poll error:', e.message); }
  }, 300_000);
  
  // Initial volume fetch
  await pollVolume();
  
  // Enable detection after 1 hour warmup
  setTimeout(() => {
    warmedUp = true;
    console.log('Warmup complete. Dump detection enabled.');
  }, 3600_000);
  
  console.log('Dump detection worker started. Warming up EMAs (1 hour)...');
}

main();
```

### Deployment (Option B: Oracle Cloud VM)

```bash
# On the VM after SSH:
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2 for process management
sudo npm install -g pm2

# Clone and start
git clone <repo-url> dump-worker
cd dump-worker && npm install

# Set env vars
export SUPABASE_URL="https://wwidaaaktxwgeeqrhghp.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<key>"

# Start with pm2 (auto-restart on crash, survive reboots)
pm2 start src/index.js --name dump-detector
pm2 save
pm2 startup
```

## 9. Client-Side Integration

### Supabase Realtime Subscription

```javascript
// Hook: useDumpAlerts.js
const channel = supabase
  .channel('dump-alerts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'dump_alerts' },
    (payload) => {
      const alert = payload.new;
      // Check against user's dump_settings
      if (meetsUserFilters(alert, userSettings)) {
        addNotification('dumpAlert', 
          `${getSeverityLabel(alert.severity)}: ${alert.item_name} dropped ${alert.drop_pct.toFixed(1)}% (${formatGP(alert.total_profit)} profit)`
        );
      }
    }
  )
  .subscribe();
```

### Notification Integration

Add `dumpAlert` to the existing notification system:

```javascript
// In useNotifications.js TYPE_PREF_KEY:
const TYPE_PREF_KEY = {
  // ... existing types
  dumpAlert: 'dumpAlert',
};

// In useNotificationSettings.js, add default preferences:
dumpAlert: {
  enabled: true,
  sound: true,
  soundChoice: 'alert',
  browserPush: true,
}
```

### Dump Alerts Page

New page showing:
- **Active dumps** (resolved_at IS NULL), sorted by severity/profit
- **Recent resolved dumps** (last 24h), for review
- **Per-alert card** showing:
  - Item icon + name
  - Severity badge (color-coded)
  - Current price vs averages (1h, 6h, 24h)
  - Drop percentage + z-score
  - Profit per item, cost per limit, total profit, ROI%
  - Volume context (5m volume vs GE limit)
  - Time since detection
  - Inline chart (fetched from `/timeseries` on demand)
- **Filters:** severity, min profit, min price, active/resolved

## 10. Resource Usage Summary

### Option A: Supabase pg_cron + Edge Function

| Resource | Free Tier Limit | This Feature Uses | % Used |
|---|---|---|---|
| Database storage | 500 MB | ~1.8 MB (alerts + ema_state blob) | 0.4% |
| Edge Function invocations | 500,000/month | ~432,000 (every 6s) | 86% |
| Database egress | 5 GB/month | ~2 GB (260KB blob read * 432k reads) | 40% |
| Realtime connections | 200 concurrent | 1 per active user | Varies |
| External hosting | N/A | None needed | N/A |

**Tightest constraint:** Edge Function invocations at 86%. Leaves ~68,000 invocations/month for other Edge Functions. If that's not enough, increase interval to 7 seconds (370k/month = 74%).

**Database egress note:** Each cycle reads the ~260KB JSONB blob. At 432k reads/month = ~112 GB raw reads. However, Supabase caches reads internally and egress is measured at the network boundary (client reads), not internal function-to-DB reads. The actual egress from Edge Function to DB stays within Supabase's infrastructure. The 5 GB egress limit applies to external clients (browsers) reading from the DB, which this feature barely touches (clients read dump_alerts, not ema_state).

### Option B: Oracle Cloud VM

| Resource | Free Tier Limit | This Feature Uses | % Used |
|---|---|---|---|
| Database storage (Supabase) | 500 MB | ~1.5 MB (alerts only, no ema_state) | 0.3% |
| Edge Function invocations | 500,000/month | 0 | 0% |
| Oracle VM (ARM) | 4 cores, 24 GB RAM | 1 core, ~100 MB RAM | 25% cores, <1% RAM |
| Oracle bandwidth | 10 TB/month | ~5 GB (API polling) | <0.1% |
| Oracle storage | 200 GB | ~1 GB (Node.js + deps) | 0.5% |
| Supabase DB writes | No hard limit | A few per hour | Negligible |

**Both options cost $0.**

### Wiki API Usage

| Metric | Option A (6s) | Option B (1s) |
|---|---|---|
| `/latest` calls/day | 14,400 | 86,400 |
| `/5m` calls/day | 288 | 288 |
| Total calls/day | 14,688 | 86,688 |
| Within API tolerance | Yes | Yes (confirmed by Omega dev) |

## 11. Risk Register

| Risk | Impact | Applies To | Mitigation |
|---|---|---|---|
| Wiki API blocks our User-Agent | Feature breaks entirely | Both | Descriptive UA, stay within confirmed limits. Monitor for 429s. |
| EMA cold start (deploy/restart) | No detection for ~1h | Both | Pre-seed EMAs from `/timeseries` on startup (Phase 4). |
| False positives (volatile items) | Users lose trust | Both | Z-score filtering + volume checks. "Good" tier and above is statistically filtered. |
| False positives (stale data) | Alert on untouched item | Both | `highTime` freshness check (must be within 5 min). |
| GE tax exempt items | Profit calc wrong | Both | Import exempt item list from existing `taxUtils.js`. |
| Supabase Realtime lag | Late notification | Both | Realtime is typically <1s. Client can also poll `dump_alerts` as fallback. |
| Edge Function invocation limit | Detection stops mid-month | Option A | Monitor usage. Increase interval to 7-8s if approaching limit. |
| JSONB blob grows too large | Slow reads/writes | Option A | Blob is fixed at ~260KB (3,700 items). Won't grow. Prune items with no trades in 30 days. |
| Edge Function 2s CPU limit | Invocation killed | Option A | Processing 3,700 items with simple math is well under 2s. Monitor execution time. |
| Oracle VM reclaimed | Worker stops | Option B | Oracle may reclaim idle Always Free instances. Keep a lightweight health check running. |
| VM requires OS maintenance | Security risk | Option B | Set up unattended-upgrades on Ubuntu. |
| Worker process crashes | Dumps missed, EMAs lost | Option B | pm2 auto-restart. EMAs rebuild over 1h warmup. |

## 12. Implementation Phases

### Phase 1: Backend (Option A)
- Create Supabase migration for `ema_state`, `dump_alerts`, and `dump_settings` tables
- Deploy Edge Function (`supabase/functions/detect-dumps/index.ts`)
- Set up pg_cron schedules (6s for prices, 5min for volume)
- Seed `ema_state` with initial data from `/latest`
- Enable Supabase Realtime on `dump_alerts`
- Wait 24h for EMAs to fully warm up
- Verify detection accuracy by comparing against Omega alerts

### Phase 2: Client - Dump Alerts Page
- New `DumpAlertsPage` component
- Supabase Realtime subscription hook (`useDumpAlerts`)
- Alert card component with severity badges
- Filters (severity, profit, price)
- Inline chart (on-demand `/timeseries` fetch)

### Phase 3: Notifications
- Add `dumpAlert` type to `useNotifications`
- Add dump alert preferences to `SettingsModal`
- `dump_settings` table for per-user filter preferences
- Per-severity sound options (louder/different for Mega+)

### Phase 4: Polish + Speed Upgrade
- Pre-seed EMAs from `/timeseries` on startup (reduce warmup from 1h to minutes)
- Slowbuy detection (insta-sell dips / margin widening)
- Historical dump performance tracking (did the price actually recover?)
- Sound customization per severity level
- **Optional: Migrate to Option B (Oracle VM)** for 1-second polling if 6s proves too slow
- Optional: premium tier with speed advantage (delay free users by 30-60s)
