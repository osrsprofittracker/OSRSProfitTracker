import { getStore } from '@netlify/blobs';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker/3.0 (https://osrs-portfolio.fun; contact: osrsprofittracker@gmail.com)';

export const ENDPOINTS = {
  mapping: {
    path: '/mapping',
    key: 'mapping',
    maxBlobAgeMs: 24 * 60 * 60 * 1000,
    cdnCacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
    browserCacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
  },
  '1h': {
    path: '/1h',
    key: '1h',
    maxBlobAgeMs: 24 * 60 * 60 * 1000,
    cdnCacheControl: 'public, max-age=900, stale-while-revalidate=3600',
    browserCacheControl: 'public, max-age=900, stale-while-revalidate=3600',
    queryParams: ['timestamp'],
    cacheKey: (params) => {
      const timestamp = params?.get('timestamp');
      return timestamp ? `1h-${timestamp}` : '1h-latest';
    },
  },
};

function getGEStore() {
  return getStore({ name: 'ge-prices', consistency: 'strong' });
}

export function getEndpointConfig(endpoint) {
  return ENDPOINTS[endpoint] || null;
}

function getCacheKey(endpoint, params = new URLSearchParams()) {
  const config = getEndpointConfig(endpoint);
  if (!config) return null;
  return config.cacheKey ? config.cacheKey(params) : config.key;
}

export function isCachedEndpointFresh(endpoint, cached) {
  const config = getEndpointConfig(endpoint);
  if (!config || !cached?.fetchedAt) return false;

  const fetchedAt = new Date(cached.fetchedAt).getTime();
  if (!Number.isFinite(fetchedAt)) return false;

  return Date.now() - fetchedAt < config.maxBlobAgeMs;
}

export async function fetchFromOrigin(endpoint, params = new URLSearchParams()) {
  const config = getEndpointConfig(endpoint);
  if (!config) {
    throw new Error(`Unsupported GE endpoint: ${endpoint}`);
  }

  const url = new URL(`${BASE_URL}${config.path}`);
  for (const param of config.queryParams || []) {
    const value = params.get(param);
    if (value != null) url.searchParams.set(param, value);
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`GE ${endpoint} fetch failed: ${response.status}`);
  }

  return response.json();
}

export async function readCachedEndpoint(endpoint, params = new URLSearchParams()) {
  const config = getEndpointConfig(endpoint);
  if (!config) return null;

  const store = getGEStore();
  const cacheKey = getCacheKey(endpoint, params);
  const cached = await store.get(cacheKey, { type: 'json' });

  if (!cached || typeof cached !== 'object' || !('payload' in cached)) {
    return null;
  }

  return cached;
}

export async function writeCachedEndpoint(endpoint, payload, params = new URLSearchParams()) {
  const config = getEndpointConfig(endpoint);
  if (!config) {
    throw new Error(`Unsupported GE endpoint: ${endpoint}`);
  }

  const cached = {
    payload,
    fetchedAt: new Date().toISOString(),
  };

  const store = getGEStore();
  const cacheKey = getCacheKey(endpoint, params);
  await store.setJSON(cacheKey, cached);
  return cached;
}

export async function refreshEndpoint(endpoint, params = new URLSearchParams()) {
  const payload = await fetchFromOrigin(endpoint, params);
  return writeCachedEndpoint(endpoint, payload, params);
}
