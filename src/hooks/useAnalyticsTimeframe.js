import { useState, useMemo, useCallback } from 'react';

const WINDOW_OPTIONS = ['1W', '1M', '3M', '6M', '1Y', 'All'];

const bucketForWindow = (window) => {
  if (window === '1W' || window === '1M' || window === '3M') return 'day';
  if (window === '6M' || window === '1Y') return 'week';
  return 'month';
};

const daysForWindow = (window) => {
  switch (window) {
    case '1W':
      return 7;
    case '1M':
      return 30;
    case '3M':
      return 90;
    case '6M':
      return 180;
    case '1Y':
      return 365;
    case 'All':
      return null;
    default:
      return 30;
  }
};

const toIsoDate = (date) => date.toISOString().slice(0, 10);

export function useAnalyticsTimeframe(userId, allTimeStart = null) {
  const storageKey = `analyticsTimeframe_${userId}`;

  const [window, setWindowState] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return WINDOW_OPTIONS.includes(stored) ? stored : '1M';
  });

  const setWindow = useCallback((next) => {
    if (!WINDOW_OPTIONS.includes(next)) return;
    setWindowState(next);
    localStorage.setItem(storageKey, next);
  }, [storageKey]);

  const { start, end, bucket } = useMemo(() => {
    const today = new Date();
    const endIso = toIsoDate(today);
    const days = daysForWindow(window);

    if (days == null) {
      return {
        start: allTimeStart || '2020-01-01',
        end: endIso,
        bucket: bucketForWindow(window),
      };
    }

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    return {
      start: toIsoDate(startDate),
      end: endIso,
      bucket: bucketForWindow(window),
    };
  }, [window, allTimeStart]);

  return { window, setWindow, start, end, bucket, options: WINDOW_OPTIONS };
}
