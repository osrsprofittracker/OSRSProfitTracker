import { useState, useEffect, useRef } from 'react';

const PROXY_URL = '/api/ge-prices';
const WIKI_BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';
const REFRESH_INTERVAL = 60_000;
const ICON_BASE_PATH = '/icons/ge';
const ICON_MANIFEST_URL = `${ICON_BASE_PATH}/manifest.json`;
const USE_DIRECT_WIKI_FALLBACK = import.meta.env.DEV;

export function useGEPrices() {
  const [prices, setPrices] = useState({});   // { [itemId]: { high, low, highTime, lowTime } }
  const [mapping, setMapping] = useState([]); // [{ id, name, limit, icon, ... }]
  const [iconMap, setIconMap] = useState({});
  const [mappingLoading, setMappingLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchHeaders = { 'User-Agent': USER_AGENT };

  const fetchGEEndpoint = async (endpoint) => {
    try {
      const res = await fetch(`${PROXY_URL}?endpoint=${endpoint}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) return res;
    } catch (proxyError) {
      if (!USE_DIRECT_WIKI_FALLBACK) throw proxyError;
    }

    if (!USE_DIRECT_WIKI_FALLBACK) return null;
    return fetch(`${WIKI_BASE_URL}/${endpoint}`, { headers: fetchHeaders });
  };

  const fetchMapping = async () => {
    try {
      const res = await fetchGEEndpoint('mapping');
      if (!res?.ok) return;
      const data = await res.json();
      setMapping(data);

      let iconManifest = null;
      try {
        const manifestRes = await fetch(ICON_MANIFEST_URL);
        if (manifestRes.ok) {
          iconManifest = await manifestRes.json();
        }
      } catch (manifestError) {
        console.warn('GE icon manifest fetch failed:', manifestError);
      }

      // Build iconMap: { [id]: iconUrl }
      const map = {};
      data.forEach(item => {
        const mirroredIcon = iconManifest?.[item.id]?.path;
        if (mirroredIcon) {
          map[item.id] = mirroredIcon;
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
      const res = await fetchGEEndpoint('latest');
      if (!res?.ok) return;
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
