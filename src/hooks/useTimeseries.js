import { useState, useEffect } from 'react';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';

export function useTimeseries(itemId, timestep) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        const res = await fetch(
          `${BASE_URL}/timeseries?id=${itemId}&timestep=${timestep}`,
          { headers: { 'User-Agent': USER_AGENT } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    return () => { cancelled = true; };
  }, [itemId, timestep]);

  return { data, loading, error };
}
