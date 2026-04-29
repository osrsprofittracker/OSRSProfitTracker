import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000;
const RETRY_DELAY_MS = 1200;

export function useJmodComments() {
  const [jmodComments, setJmodComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const lastErrorRef = useRef(null);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchComments = async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      let response = await fetch('/api/jmod-comments');
      if (!response.ok && response.status >= 500) {
        await sleep(RETRY_DELAY_MS);
        response = await fetch('/api/jmod-comments');
      }
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setJmodComments(Array.isArray(data) ? data : []);
      lastErrorRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (lastErrorRef.current !== message) {
        console.error('Error fetching Jmod comments:', err);
        lastErrorRef.current = message;
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, POLL_INTERVAL);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchComments();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { jmodComments, loading, error };
}
