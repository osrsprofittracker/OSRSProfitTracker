# Cloudflare Cache Setup

Use this when the Netlify site is proxied through Cloudflare. The goal is to let Cloudflare serve cacheable shared OSRS data from edge cache so Netlify Functions are only hit on cache misses.

## DNS

1. Add the production domain to Cloudflare.
2. Point the domain at Netlify using the current Netlify DNS target.
3. Keep the DNS record proxied in Cloudflare. The cloud icon must be orange.
4. Keep Netlify as the origin and deploy host.

## Cache Rules

Create one Cloudflare Cache Rule for cacheable GE price API paths:

```txt
Name: Cache GE price API
When: URI Path is /api/ge-prices/latest, /api/ge-prices/mapping, /api/ge-prices/1h, or /api/ge-prices/timeseries
Cache eligibility: Eligible for cache
Edge TTL: Respect origin headers
Browser TTL: Respect origin headers
Cache key: Include query string, or use default full URL cache key
```

The app calls:

```txt
/api/ge-prices/latest
/api/ge-prices/mapping
/api/ge-prices/1h
/api/ge-prices/timeseries
```

The browser routes Wiki API calls through `/api/ge-prices/*` so production is not dependent on third-party CORS headers.

Optional extra rules:

```txt
/api/osrs-news
Edge TTL: 10 minutes

/api/jmod-comments
Edge TTL: 10 minutes
```

Both functions already return public cache headers, so a Cloudflare rule is only needed if Cloudflare does not cache them from origin headers.

## Expected Headers

For `/api/ge-prices/mapping`, the origin returns longer-lived cache headers.

For `/api/ge-prices/latest`, the origin returns short-lived cache headers.

For `/api/ge-prices/1h`, the origin returns medium-lived cache headers.

For `/api/ge-prices/timeseries`, the origin returns medium-lived cache headers and includes the query string in the cache key.

## Verification

After deploying and enabling Cloudflare, check:

```powershell
curl.exe -I https://YOUR_DOMAIN/api/ge-prices/mapping
curl.exe -I https://YOUR_DOMAIN/api/ge-prices/latest
curl.exe -I "https://YOUR_DOMAIN/api/ge-prices/1h?timestamp=UNIX_TIMESTAMP"
curl.exe -I "https://YOUR_DOMAIN/api/ge-prices/timeseries?id=31722&timestep=5m"
```

Look for:

```txt
cf-cache-status: HIT
cache-control: public
```

The first request can be `MISS`; repeat the request after a few seconds. The repeated request should usually be `HIT`.

## What Still Hits Netlify

Cloudflare cache misses for `/api/ge-prices/*` still hit Netlify. Netlify then fetches the OSRS Wiki API server-side and stores cacheable responses in Netlify Blobs.

