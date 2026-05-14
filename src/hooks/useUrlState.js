import { useCallback, useEffect, useMemo, useState } from 'react';

const resolveInitial = (initial) => (
  typeof initial === 'function' ? initial() : initial
);

const defaultParse = (value) => value;
const defaultSerialize = (value) => (
  value === undefined || value === null || value === '' ? null : String(value)
);

export function useUrlState(
  key,
  initial,
  parse = defaultParse,
  serialize = defaultSerialize,
  options = {}
) {
  const defaultHistory = options.history || 'replace';

  const readValue = useCallback(() => {
    const fallback = resolveInitial(initial);
    const params = new URLSearchParams(window.location.search);
    const rawValue = params.get(key);
    const parsed = parse(rawValue, params);
    return parsed == null ? fallback : parsed;
  }, [initial, key, parse]);

  const [value, setValueState] = useState(readValue);

  useEffect(() => {
    const handlePopState = () => {
      setValueState(readValue());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [readValue]);

  const setValue = useCallback((next, updateOptions = {}) => {
    setValueState((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      const serialized = serialize(resolved);
      const url = new URL(window.location.href);

      if (serialized == null || serialized === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, serialized);
      }

      const historyMode = updateOptions.history || defaultHistory;
      const state = window.history.state || {};
      const historyMethod = historyMode === 'push' ? 'pushState' : 'replaceState';
      window.history[historyMethod](state, '', url);

      return resolved;
    });
  }, [defaultHistory, key, serialize]);

  return useMemo(() => [value, setValue], [value, setValue]);
}
