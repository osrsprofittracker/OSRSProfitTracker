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
    'CDN-Cache-Control': config.cdnCacheControl,
    'Netlify-CDN-Cache-Control': config.cdnCacheControl,
    'X-GE-Cache-Source': source,
    'X-GE-Cache-Fetched-At': cached.fetchedAt || '',
  };
}

function staleResponseHeaders(config, cached) {
  return {
    ...responseHeaders(config, cached, 'stale-blob'),
    'Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
  };
}

function getRequestedEndpoint(request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint');
  if (endpoint) return endpoint;

  const pathEndpoint = url.pathname.split('/').filter(Boolean).pop();
  if (pathEndpoint && pathEndpoint !== 'ge-prices') return pathEndpoint;

  return 'mapping';
}

function getEndpointParams(request) {
  const url = new URL(request.url);
  return url.searchParams;
}

function validateEndpointRequest(endpoint, params) {
  if (endpoint === 'timeseries') {
    const id = params.get('id');
    const timestep = params.get('timestep');

    if (!id || !/^\d+$/.test(id)) {
      return 'id must be a numeric item id';
    }

    if (!['5m', '1h', '6h', '24h'].includes(timestep)) {
      return 'timestep must be one of: 5m, 1h, 6h, 24h';
    }

    return null;
  }

  if (endpoint !== '1h') return null;

  const timestamp = params.get('timestamp');
  if (timestamp != null && !/^\d+$/.test(timestamp)) {
    return 'timestamp must be a Unix timestamp in seconds';
  }

  return null;
}

export default async function handler(request) {
  if (request.method !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const endpoint = getRequestedEndpoint(request);
  const params = getEndpointParams(request);
  const config = getEndpointConfig(endpoint);

  if (!config) {
    return json(400, { error: `Unsupported GE endpoint: ${endpoint}` });
  }

  const validationError = validateEndpointRequest(endpoint, params);
  if (validationError) {
    return json(400, { error: validationError });
  }

  try {
    const cached = await readCachedEndpoint(endpoint, params);

    if (cached && isCachedEndpointFresh(endpoint, cached)) {
      return json(200, cached.payload, responseHeaders(config, cached, 'blob'));
    }

    if (cached) {
      try {
        const refreshed = await refreshEndpoint(endpoint, params);
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
    const refreshed = await refreshEndpoint(endpoint, params);
    return json(200, refreshed.payload, responseHeaders(config, refreshed, 'origin'));
  } catch (originError) {
    console.error(`GE ${endpoint} origin fallback error:`, originError.message);
    return json(502, { error: `GE ${endpoint} cache unavailable` });
  }
}
