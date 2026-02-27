import { useState, useEffect, useRef } from 'react';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const REFRESH_INTERVAL = 60_000;

export function useGEPrices() {
  const [prices, setPrices] = useState({});   // { [itemId]: { high, low, highTime, lowTime } }
  const [mapping, setMapping] = useState([]); // [{ id, name, limit, icon, ... }]
  const [iconMap, setIconMap] = useState({});
  const [mappingLoading, setMappingLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchHeaders = { 'User-Agent': USER_AGENT };

  const fetchMapping = async () => {
    try {
      const res = await fetch(`${BASE_URL}/mapping`, { headers: fetchHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setMapping(data);
      // Build iconMap: { [id]: iconUrl }
      const map = {};
      data.forEach(item => {
        if (item.icon) {
          map[item.id] = `https://oldschool.runescape.wiki/images/${item.icon.replace(/ /g, '_')}`;
        }
      });
      setIconMap(map);
    } catch (e) {
      console.error('GE mapping fetch failed:', e);
    } finally {
      setMappingLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/latest`, { headers: fetchHeaders });
      if (!res.ok) return;
      const json = await res.json();
      setPrices(json.data || {});
    } catch (e) {
      console.error('GE prices fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchMapping();
    fetchPrices();

    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { prices, mapping, mappingLoading, iconMap };
}