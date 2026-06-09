import { useState, useEffect } from 'react';

const PROXY_URL = '/api/ge-prices';
const WIKI_BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const USE_DIRECT_WIKI_FALLBACK = import.meta.env.DEV;

async function fetchTimeseries(itemId, timestep) {
  const endpoint = `timeseries?id=${itemId}&timestep=${timestep}`;

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

export function useTimeseries(itemId, timestep, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refetchIntervalMs = options.refetchIntervalMs ?? 60_000;

  useEffect(() => {
    if (!itemId || !timestep) {
      setData([]);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchTimeseries(itemId, timestep);
        if (!res?.ok) throw new Error(`HTTP ${res?.status || 'unavailable'}`);
        const json = await res.json();
        if (!cancelled) setData(json.data || []);
      } catch (e) {
        if (!cancelled) {
          console.error('Timeseries fetch failed:', e);
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = refetchIntervalMs ? setInterval(fetchData, refetchIntervalMs) : null;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [itemId, timestep, refetchIntervalMs]);

  return { data, loading, error };
}
