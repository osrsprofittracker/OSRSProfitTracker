import {
  getEndpointConfig,
  isCachedEndpointFresh,
  readCachedEndpoint,
  refreshEndpoint,
} from './_shared/ge-cache.mjs';

function json(statusCode, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function responseHeaders(config, cached, source) {
  return {
    'Cache-Control': config.browserCacheControl,
    'Netlify-CDN-Cache-Control': config.cdnCacheControl,
    'X-GE-Cache-Source': source,
    'X-GE-Cache-Fetched-At': cached.fetchedAt || '',
  };
}

function staleResponseHeaders(config, cached) {
  return {
    ...responseHeaders(config, cached, 'stale-blob'),
    'Cache-Control': 'no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
  };
}

export default async function handler(request) {
  if (request.method !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || 'latest';
  const config = getEndpointConfig(endpoint);

  if (!config) {
    return json(400, { error: `Unsupported GE endpoint: ${endpoint}` });
  }

  try {
    const cached = await readCachedEndpoint(endpoint);

    if (cached && isCachedEndpointFresh(endpoint, cached)) {
      return json(200, cached.payload, responseHeaders(config, cached, 'blob'));
    }

    if (cached) {
      try {
        const refreshed = await refreshEndpoint(endpoint);
        return json(200, refreshed.payload, responseHeaders(config, refreshed, 'origin-refresh'));
      } catch (refreshError) {
        console.error(`GE ${endpoint} stale refresh error:`, refreshError.message);
        return json(200, cached.payload, staleResponseHeaders(config, cached));
      }
    }
  } catch (cacheReadError) {
    console.error(`GE ${endpoint} cache read error:`, cacheReadError.message);
  }

  try {
    const refreshed = await refreshEndpoint(endpoint);
    return json(200, refreshed.payload, responseHeaders(config, refreshed, 'origin'));
  } catch (originError) {
    console.error(`GE ${endpoint} origin fallback error:`, originError.message);
    return json(502, { error: `GE ${endpoint} cache unavailable` });
  }
}
