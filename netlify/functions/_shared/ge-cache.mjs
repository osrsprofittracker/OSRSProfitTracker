import { getStore } from '@netlify/blobs';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';

export const ENDPOINTS = {
  latest: {
    path: '/latest',
    key: 'latest',
    maxBlobAgeMs: 70_000,
    cdnCacheControl: 'public, max-age=60, stale-while-revalidate=30',
    browserCacheControl: 'public, max-age=30, stale-while-revalidate=30',
  },
  mapping: {
    path: '/mapping',
    key: 'mapping',
    maxBlobAgeMs: 24 * 60 * 60 * 1000,
    cdnCacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
    browserCacheControl: 'public, max-age=3600, stale-while-revalidate=86400',
  },
};

function getGEStore() {
  return getStore({ name: 'ge-prices', consistency: 'strong' });
}

export function getEndpointConfig(endpoint) {
  return ENDPOINTS[endpoint] || null;
}

export function isCachedEndpointFresh(endpoint, cached) {
  const config = getEndpointConfig(endpoint);
  if (!config || !cached?.fetchedAt) return false;

  const fetchedAt = new Date(cached.fetchedAt).getTime();
  if (!Number.isFinite(fetchedAt)) return false;

  return Date.now() - fetchedAt < config.maxBlobAgeMs;
}

export async function fetchFromOrigin(endpoint) {
  const config = getEndpointConfig(endpoint);
  if (!config) {
    throw new Error(`Unsupported GE endpoint: ${endpoint}`);
  }

  const response = await fetch(`${BASE_URL}${config.path}`, {
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

export async function readCachedEndpoint(endpoint) {
  const config = getEndpointConfig(endpoint);
  if (!config) return null;

  const store = getGEStore();
  const cached = await store.get(config.key, { type: 'json' });

  if (!cached || typeof cached !== 'object' || !('payload' in cached)) {
    return null;
  }

  return cached;
}

export async function writeCachedEndpoint(endpoint, payload) {
  const config = getEndpointConfig(endpoint);
  if (!config) {
    throw new Error(`Unsupported GE endpoint: ${endpoint}`);
  }

  const cached = {
    payload,
    fetchedAt: new Date().toISOString(),
  };

  const store = getGEStore();
  await store.setJSON(config.key, cached);
  return cached;
}

export async function refreshEndpoint(endpoint) {
  const payload = await fetchFromOrigin(endpoint);
  return writeCachedEndpoint(endpoint, payload);
}
