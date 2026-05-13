import { useEffect, useMemo, useState } from 'react';

const PROXY_URL = '/api/ge-prices';
const WIKI_BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const REFRESH_INTERVAL = 15 * 60_000;
const USE_DIRECT_WIKI_FALLBACK = import.meta.env.DEV;

function getBaselineTimestamp() {
  return Math.floor((Date.now() - DAY_MS) / HOUR_MS) * 3600;
}

async function fetchBaseline(timestamp) {
  const endpoint = `1h?timestamp=${timestamp}`;

  try {
    const res = await fetch(`${PROXY_URL}/${endpoint}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) return res;
  } catch (proxyError) {
    if (!USE_DIRECT_WIKI_FALLBACK) throw proxyError;
  }

  if (!USE_DIRECT_WIKI_FALLBACK) return null;
  return fetch(`${WIKI_BASE_URL}/${endpoint}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

export function useGEPriceBaseline() {
  const [baselinePrices, setBaselinePrices] = useState({});
  const [baselineTimestamp, setBaselineTimestamp] = useState(() => getBaselineTimestamp());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let initialLoad = true;

    const loadBaseline = async () => {
      const timestamp = getBaselineTimestamp();
      if (initialLoad) setLoading(true);
      setError(null);

      try {
        const res = await fetchBaseline(timestamp);
        if (!res?.ok) throw new Error(`GE 1h fetch failed${res ? `: ${res.status}` : ''}`);
        const json = await res.json();

        if (!cancelled) {
          setBaselineTimestamp(timestamp);
          setBaselinePrices(json.data || {});
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error('GE 24h baseline fetch failed:', fetchError);
          setBaselinePrices({});
          setError(fetchError.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
        initialLoad = false;
      }
    };

    loadBaseline();
    const interval = setInterval(loadBaseline, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return useMemo(() => ({
    baselinePrices,
    baselineTimestamp,
    loading,
    error,
  }), [baselinePrices, baselineTimestamp, loading, error]);
}
