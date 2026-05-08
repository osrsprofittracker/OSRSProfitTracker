import {
  readCachedEndpoint,
  refreshEndpoint,
} from './_shared/ge-cache.mjs';

const MAPPING_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isOlderThan(cached, intervalMs) {
  if (!cached?.fetchedAt) return true;
  return Date.now() - new Date(cached.fetchedAt).getTime() > intervalMs;
}

async function refreshLatest() {
  const cached = await refreshEndpoint('latest');
  return { refreshed: true, fetchedAt: cached.fetchedAt };
}

async function refreshMappingIfNeeded() {
  const cached = await readCachedEndpoint('mapping');

  if (!isOlderThan(cached, MAPPING_REFRESH_INTERVAL_MS)) {
    return { refreshed: false, fetchedAt: cached.fetchedAt };
  }

  const refreshed = await refreshEndpoint('mapping');
  return { refreshed: true, fetchedAt: refreshed.fetchedAt };
}

export default async function handler() {
  const results = {};
  const errors = {};

  try {
    results.latest = await refreshLatest();
  } catch (error) {
    console.error('GE latest cache refresh failed:', error.message);
    errors.latest = error.message;
  }

  try {
    results.mapping = await refreshMappingIfNeeded();
  } catch (error) {
    console.error('GE mapping cache refresh failed:', error.message);
    errors.mapping = error.message;
  }

  const hasErrors = Object.keys(errors).length > 0;
  return json(hasErrors ? 207 : 200, { success: !hasErrors, results, errors });
}

export const config = {
  schedule: '*/1 * * * *',
};
