import { useState, useEffect, useRef } from 'react';
import { CURRENT_VERSION } from '../data/changelog';

const PROXY_URL = '/api/ge-prices';
const WIKI_BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const REFRESH_INTERVAL = 60_000;
const ICON_BASE_PATH = '/icons/ge';
const ICON_MANIFEST_URL = `${ICON_BASE_PATH}/manifest.json`;
const ICON_CACHE_VERSION_KEY = 'osrs_icon_cache_version';

function getIconCacheVersion() {
  try {
    return localStorage.getItem(ICON_CACHE_VERSION_KEY) || CURRENT_VERSION;
  } catch {
    return CURRENT_VERSION;
  }
}

function getVersionedAssetUrl(path, version) {
  if (!path) return '';
  if (!version) return path;
  return `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

export function useGEPrices() {
  const [prices, setPrices] = useState({});   // { [itemId]: { high, low, highTime, lowTime } }
  const [mapping, setMapping] = useState([]); // [{ id, name, limit, icon, ... }]
  const [iconMap, setIconMap] = useState({});
  const [mappingLoading, setMappingLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchWikiEndpoint = (endpoint) => fetch(`${WIKI_BASE_URL}/${endpoint}`, {
    cache: endpoint === 'latest' ? 'no-store' : 'default',
  });

  const fetchProxyEndpoint = (endpoint) => fetch(`${PROXY_URL}/${endpoint}`);

  const isJsonResponse = (res) => {
    const contentType = res.headers.get('content-type') || '';
    return res.ok && contentType.includes('application/json');
  };

  const fetchGEEndpoint = async (endpoint) => {
    try {
      const res = await fetchWikiEndpoint(endpoint);
      if (isJsonResponse(res)) return res;
    } catch {
      // Fall back to the first-party proxy when the Wiki API has a CORS or network issue.
    }

    try {
      const res = await fetchProxyEndpoint(endpoint);
      if (isJsonResponse(res)) return res;
    } catch {
      return null;
    }

    return null;
  };

  const fetchMapping = async () => {
    try {
      const res = await fetchGEEndpoint('mapping');
      if (!res?.ok) return;
      const data = await res.json();
      setMapping(data);

      let iconManifest = null;
      try {
        const manifestRes = await fetch(getVersionedAssetUrl(ICON_MANIFEST_URL, CURRENT_VERSION));
        if (manifestRes.ok) {
          iconManifest = await manifestRes.json();
        }
      } catch (manifestError) {
        console.warn('GE icon manifest fetch failed:', manifestError);
      }

      // Build iconMap: { [id]: iconUrl }
      const map = {};
      const iconCacheVersion = getIconCacheVersion();
      data.forEach(item => {
        const mirroredIcon = iconManifest?.[item.id]?.path;
        if (mirroredIcon) {
          map[item.id] = getVersionedAssetUrl(mirroredIcon, iconCacheVersion);
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
    const clearPriceInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startPriceInterval = () => {
      clearPriceInterval();
      if (document.visibilityState === 'visible') {
        intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPrices();
        startPriceInterval();
      } else {
        clearPriceInterval();
      }
    };

    fetchMapping();
    if (document.visibilityState === 'visible') {
      fetchPrices();
    }
    startPriceInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearPriceInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { prices, mapping, mappingLoading, iconMap };
}
