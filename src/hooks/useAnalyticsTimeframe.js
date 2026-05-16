import { useEffect, useMemo, useCallback } from 'react';
import { subtractDays, toIsoDate } from '../utils/analyticsHelpers';
import { useUrlState } from './useUrlState';

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

const parseWindowParam = (value) => (
  WINDOW_OPTIONS.includes(value) ? value : null
);

const serializeWindowParam = (value) => (
  WINDOW_OPTIONS.includes(value) ? value : null
);

export function useAnalyticsTimeframe(userId, allTimeStart = null) {
  const storageKey = `analyticsTimeframe_${userId}`;

  const initialWindow = useCallback(() => {
    const stored = localStorage.getItem(storageKey);
    return WINDOW_OPTIONS.includes(stored) ? stored : '1M';
  }, [storageKey]);

  const [window, setWindowState] = useUrlState(
    'window',
    initialWindow,
    parseWindowParam,
    serializeWindowParam,
    { history: 'push' }
  );

  useEffect(() => {
    const url = new URL(globalThis.location.href);
    if (url.searchParams.get('window') === window) return;

    url.searchParams.set('window', window);
    globalThis.history.replaceState(globalThis.history.state || {}, '', url);
  }, [window]);

  const setWindow = useCallback((next) => {
    if (!WINDOW_OPTIONS.includes(next)) return;
    setWindowState(next, { history: 'push' });
    localStorage.setItem(storageKey, next);
  }, [setWindowState, storageKey]);

  const { start, end, bucket } = useMemo(() => {
    const endIso = toIsoDate(new Date());
    const days = daysForWindow(window);

    if (days == null) {
      return {
        start: allTimeStart || '2020-01-01',
        end: endIso,
        bucket: bucketForWindow(window),
      };
    }

    return {
      start: subtractDays(endIso, days - 1),
      end: endIso,
      bucket: bucketForWindow(window),
    };
  }, [window, allTimeStart]);

  return { window, setWindow, start, end, bucket, options: WINDOW_OPTIONS };
}
