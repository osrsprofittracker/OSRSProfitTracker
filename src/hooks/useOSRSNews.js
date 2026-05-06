import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes (server cache updates every minute)
const RETRY_DELAY_MS = 1200;

export function useOSRSNews() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const lastErrorRef = useRef(null);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchNews = async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      let response = await fetch('/api/osrs-news');

      if (!response.ok && response.status >= 500) {
        await sleep(RETRY_DELAY_MS);
        response = await fetch('/api/osrs-news');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      setNewsItems(Array.isArray(data) ? data : []);
      lastErrorRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (lastErrorRef.current !== message) {
        console.error('Error fetching OSRS news:', err);
        lastErrorRef.current = message;
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { newsItems, loading, error };
}
