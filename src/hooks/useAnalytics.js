import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const cache = new Map();

const truncDay = (dateStr) => dateStr.slice(0, 10);

const truncWeek = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
};

const truncMonth = (dateStr) => `${dateStr.slice(0, 7)}-01`;

const truncBucket = (dateStr, bucket) => {
  if (bucket === 'day') return truncDay(dateStr);
  if (bucket === 'week') return truncWeek(dateStr);
  return truncMonth(dateStr);
};

export function aggregateBucketsLocally({ transactions, stocks, profitHistory, start, end, bucket }) {
  const stockMap = new Map((stocks || []).map((stock) => [stock.id, stock]));
  const txMap = new Map((transactions || []).map((tx) => [tx.id, tx]));
  const inWindow = (iso) => iso >= start && iso <= end;
  const buckets = new Map();

  const ensureBucket = (key) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        bucket_date: key,
        profit_items: 0,
        profit_dump: 0,
        profit_referral: 0,
        profit_bonds: 0,
        gp_traded: 0,
        by_category: {},
        sells_count: 0,
        wins_count: 0,
      });
    }

    return buckets.get(key);
  };

  for (const tx of transactions || []) {
    const iso = String(tx.date || '').slice(0, 10);
    if (!inWindow(iso)) continue;

    const key = truncBucket(iso, bucket);
    const row = ensureBucket(key);
    row.gp_traded += Number(tx.total) || 0;
  }

  for (const profit of profitHistory || []) {
    const tx = txMap.get(profit.transaction_id);
    const isoSource = profit.profit_type === 'stock' && tx?.date ? tx.date : profit.created_at;
    const iso = String(isoSource || '').slice(0, 10);
    if (!inWindow(iso)) continue;

    const key = truncBucket(iso, bucket);
    const row = ensureBucket(key);
    const amount = Number(profit.amount) || 0;

    if (profit.profit_type === 'stock') {
      const stockId = profit.stock_id ?? tx?.stock_id ?? tx?.stockId;
      const category = stockMap.get(stockId)?.category || 'Uncategorized';

      row.profit_items += amount;
      row.sells_count += 1;
      if (amount > 0) row.wins_count += 1;
      row.by_category[category] = (row.by_category[category] || 0) + amount;
      continue;
    }

    if (profit.profit_type === 'dump') row.profit_dump += amount;
    if (profit.profit_type === 'referral') row.profit_referral += amount;
    if (profit.profit_type === 'bonds') row.profit_bonds += amount;
  }

  return [...buckets.values()].sort((a, b) => a.bucket_date.localeCompare(b.bucket_date));
}

export function useAnalytics({ userId, start, end, bucket, fallbackData }) {
  const [state, setState] = useState({
    buckets: [],
    loading: true,
    error: null,
    fromFallback: false,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId) {
      setState({ buckets: [], loading: false, error: null, fromFallback: false });
      return;
    }

    const cacheKey = `${userId}-${start}-${end}-${bucket}`;
    if (cache.has(cacheKey)) {
      setState({ buckets: cache.get(cacheKey), loading: false, error: null, fromFallback: false });
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    supabase.rpc('get_analytics_buckets', {
      p_user_id: userId,
      p_start: start,
      p_end: end,
      p_bucket: bucket,
    }).then(({ data, error }) => {
      if (requestId !== requestIdRef.current) return;

      if (error) {
        const local = fallbackData
          ? aggregateBucketsLocally({ ...fallbackData, start, end, bucket })
          : [];
        setState({ buckets: local, loading: false, error: error.message, fromFallback: true });
        return;
      }

      const buckets = data || [];
      cache.set(cacheKey, buckets);
      setState({ buckets, loading: false, error: null, fromFallback: false });
    });
  }, [userId, start, end, bucket, fallbackData]);

  return state;
}

export const __clearAnalyticsCache = () => cache.clear();
