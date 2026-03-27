import { useState, useEffect } from 'react';

const POLL_INTERVAL = 60 * 1000;

export function useOSRSNews() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/osrs-news');

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();
      setNewsItems(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching OSRS news:', err);
    } finally {
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
