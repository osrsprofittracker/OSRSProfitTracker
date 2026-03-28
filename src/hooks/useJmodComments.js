import { useState, useEffect } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000;

export function useJmodComments() {
  const [jmodComments, setJmodComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/jmod-comments');
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setJmodComments(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching Jmod comments:', err);
    } finally {
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
