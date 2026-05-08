# Cloudflare Cache Setup

Use this when the Netlify site is proxied through Cloudflare. The goal is to let Cloudflare serve shared public OSRS data from edge cache so Netlify Functions are only hit on cache misses.

## DNS

1. Add the production domain to Cloudflare.
2. Point the domain at Netlify using the current Netlify DNS target.
3. Keep the DNS record proxied in Cloudflare. The cloud icon must be orange.
4. Keep Netlify as the origin and deploy host.

## Cache Rules

Create one Cloudflare Cache Rule for GE prices:

```txt
Name: Cache GE price API
When: URI Path starts with /api/ge-prices/
Cache eligibility: Eligible for cache
Edge TTL: Respect origin headers
Browser TTL: Respect origin headers
Cache key: Include query string, or use default full URL cache key
```

The app now calls:

```txt
/api/ge-prices/latest
/api/ge-prices/mapping
```

Those paths are deliberately separate so Cloudflare does not need to rely on `endpoint=latest` and `endpoint=mapping` query-string handling for the main app flow.

Optional extra rules:

```txt
/api/osrs-news
Edge TTL: 10 minutes

/api/jmod-comments
Edge TTL: 10 minutes
```

Both functions already return public cache headers, so a Cloudflare rule is only needed if Cloudflare does not cache them from origin headers.

## Expected Headers

For `/api/ge-prices/latest`, the origin returns:

```txt
Cache-Control: public, max-age=30, stale-while-revalidate=30
CDN-Cache-Control: public, max-age=60, stale-while-revalidate=30
Netlify-CDN-Cache-Control: public, max-age=60, stale-while-revalidate=30
```

For `/api/ge-prices/mapping`, the origin returns longer-lived cache headers.

## Verification

After deploying and enabling Cloudflare, check:

```powershell
curl.exe -I https://YOUR_DOMAIN/api/ge-prices/latest
curl.exe -I https://YOUR_DOMAIN/api/ge-prices/mapping
```

Look for:

```txt
cf-cache-status: HIT
cache-control: public, max-age=30, stale-while-revalidate=30
cdn-cache-control: public, max-age=60, stale-while-revalidate=30
```

The first request can be `MISS`; repeat the request after a few seconds. The second request should usually be `HIT`.

## What Still Hits Netlify

Cloudflare cache misses still hit Netlify. The scheduled `ge-prices-cache` function also keeps running every minute on Netlify so fresh GE data is ready before users ask for it.

