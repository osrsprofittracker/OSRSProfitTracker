# OSRS News Caching System

## Overview

The app fetches OSRS news articles from the RuneScape website and displays them to users. Previously, every user's browser was polling the news endpoint every 60 seconds, which meant:
- 100 users = 100 requests/minute to RuneScape (wasteful)
- High load on the API

The new system uses **server-side caching** to solve this:
- Server polls RuneScape once every 60 seconds
- Results are cached in Supabase
- Users fetch the cached data every 60 seconds
- Result: 1 request/minute to RuneScape, not per-user

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser (React Hook: useOSRSNews)      │
│  Polls /api/osrs-news every 60 seconds   │
└────────────────┬────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  /api/osrs-news            │
    │  (osrs-news.js function)   │
    │  Reads from cache          │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  Supabase: news_cache      │
    │  table (cached articles)   │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  osrs-news-cache.js        │
    │  (Scheduled function)      │
    │  Runs every 60 seconds     │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │  RuneScape News API        │
    │  (secure.runescape.com)    │
    └────────────────────────────┘
```

---

## Components

### 1. **Scheduled Function: `netlify/functions/osrs-news-cache.js`**

**What it does:**
- Runs every 60 seconds (scheduled by Netlify)
- Fetches news from RuneScape's website
- Parses HTML to extract article metadata
- Stores the articles in Supabase `news_cache` table

**How it works:**
```javascript
1. Fetch HTML from https://secure.runescape.com/m=news/a=13/archive?oldschool=1
2. Parse with regex to extract articles
3. For each article, extract: guid, title, link, pubDate
4. PATCH Supabase news_cache table with the articles
5. Log success/error
```

**Key config:**
```javascript
exports.config = {
  schedule: '*/1 * * * *', // Cron: every 1 minute
};
```

**Environment vars needed:**
- `VITE_SUPABASE_URL` — Supabase instance URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for write access)

---

### 2. **API Function: `netlify/functions/osrs-news.js`**

**What it does:**
- Endpoint: `GET /api/osrs-news`
- Serves cached news to the browser
- Falls back to direct fetch if cache is empty (shouldn't happen)

**How it works:**
```javascript
1. Query Supabase news_cache table for cached articles
2. If found, return them (fast ✓)
3. If not found, fetch directly from RuneScape (fallback)
4. Return JSON array of articles
```

**Article format:**
```json
[
  {
    "guid": "https://secure.runescape.com/m=news/c=...",
    "title": "Grand Exchange Price Limits Updated",
    "link": "https://secure.runescape.com/m=news/c=...",
    "pubDate": "2026-03-27"
  },
  ...
]
```

**Environment vars needed:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — Public key (for read access)

---

### 3. **React Hook: `src/hooks/useOSRSNews.js`**

**What it does:**
- Called from `MainApp.jsx`
- Manages local state: `newsItems`, `loading`, `error`
- Polls `/api/osrs-news` endpoint

**How it works:**
```javascript
1. On mount, fetch /api/osrs-news immediately
2. Set up interval to fetch every 60 seconds (60,000 ms)
3. Also listen for visibility change (tab refocus) and fetch immediately
4. Cleanup: clear interval and event listener on unmount
```

**Exports:**
```javascript
const { newsItems, loading, error } = useOSRSNews();
```

---

## Supabase Setup

### Create the cache table:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
CREATE TABLE news_cache (
  id BIGINT PRIMARY KEY DEFAULT 1,
  cached_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Allow public read access (for osrs-news.js)
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON news_cache
  FOR SELECT USING (true);

-- Allow service role to update (for osrs-news-cache.js)
CREATE POLICY "Allow service role write" ON news_cache
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role insert" ON news_cache
  FOR INSERT WITH CHECK (true);
```

3. Verify: Go to **Table Editor**, you should see `news_cache` with one row (id=1)

---

## Data Flow

### Every 60 seconds:

```
osrs-news-cache.js (scheduled)
  ↓
  Fetch from https://secure.runescape.com/m=news/...
  ↓
  Parse HTML, extract articles
  ↓
  PATCH Supabase news_cache table
  ↓
  Cache is now fresh
```

### Every time user loads the page or every 60 seconds:

```
Browser calls useOSRSNews hook
  ↓
  Calls GET /api/osrs-news
  ↓
  osrs-news.js queries Supabase news_cache
  ↓
  Returns cached articles (already fresh from scheduled function)
  ↓
  React state updated, UI re-renders
```

---

## Testing

### Local Setup

1. **Create the Supabase table** (see "Supabase Setup" above)

2. **Run the dev server:**
   ```bash
   netlify dev
   ```

3. **Test the cache function (manually trigger it):**
   ```bash
   netlify functions:invoke osrs-news-cache
   ```

   Expected output:
   ```
   Scheduled: Fetching OSRS news for cache...
   Fetched 9 articles, updating cache...
   Cached 9 articles
   ```

4. **Test the API endpoint:**
   ```bash
   curl http://localhost:3000/api/osrs-news
   ```

   Expected output: JSON array of articles
   ```json
   [
     {
       "guid": "https://secure.runescape.com/...",
       "title": "...",
       "link": "https://secure.runescape.com/...",
       "pubDate": "2026-03-27"
     },
     ...
   ]
   ```

5. **Test the React hook:**
   - Open the app in browser (http://localhost:3000)
   - Open DevTools → Console
   - The hook should call `/api/osrs-news` immediately
   - You should see news articles appear on the page

### Monitoring the Cache

1. Go to **Supabase → Table Editor → news_cache**
2. You should see one row (id=1)
3. `last_updated` should be recent (within the last 60 seconds)
4. `cached_articles` should contain an array of articles

### After Deployment

1. Commit and push your changes
2. Netlify automatically deploys
3. Go to **Netlify → Functions → osrs-news-cache**
4. You should see logs like:
   ```
   Scheduled: Fetching OSRS news for cache...
   Cached 9 articles
   ```
5. These logs should appear every 60 seconds

---

## Troubleshooting

### "Error: The environment has not been configured to use Netlify Blobs"

**Cause:** Old code tried to use Netlify Blobs instead of Supabase.

**Fix:** You've already been updated to use Supabase (news_cache table). No action needed.

### "Failed to cache articles: 404"

**Cause:** The `news_cache` table doesn't exist in Supabase.

**Fix:** Create it (see "Supabase Setup" section above).

### "/api/osrs-news returns empty array"

**Cause 1:** Cache is empty (hasn't been populated yet)
- **Fix:** Run `netlify functions:invoke osrs-news-cache` to manually populate it

**Cause 2:** Scheduled function isn't running
- **Fix:** Check Netlify function logs, verify the function deployed correctly

### "/api/osrs-news returns 502"

**Cause:** Function error (usually environment vars missing)

**Fix:** Check that `.env` has:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (on server only)

---

## Performance

| Metric | Before | After |
|--------|--------|-------|
| Requests/min to RuneScape | ~1 per user | 1 (total) |
| Browser poll interval | 60 seconds | 60 seconds |
| Cache freshness | Real-time | ≤60 seconds |
| Load on RuneScape | High (scales with users) | Low (constant) |

---

## Files Changed

- **Created:** `netlify/functions/osrs-news-cache.js` — Scheduled cache updater
- **Modified:** `netlify/functions/osrs-news.js` — Now reads from cache
- **Modified:** `src/hooks/useOSRSNews.js` — Increased poll interval from 60s to 5min
- **Created (Supabase):** `news_cache` table — Stores cached articles

---

## Summary

1. **Supabase** stores the cached articles (updated every 60 seconds)
2. **Scheduled function** (osrs-news-cache.js) polls RuneScape every 60 seconds and updates the cache
3. **API function** (osrs-news.js) serves the cached data to the browser
4. **React hook** (useOSRSNews) polls the API every 60 seconds (or on tab focus)
5. **Result:** 1 request/min to RuneScape, fresh data for all users, reduced server load
