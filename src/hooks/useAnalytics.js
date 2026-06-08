import { useState, useEffect } from 'react';
import { formatLocalDate } from '../utils/localPeriods';

const MAX_CACHE_ENTRIES = 50;
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

const aggregateGpTradedLocally = ({ transactions, start, end, bucket }) => {
  const totals = new Map();

  for (const tx of transactions || []) {
    const iso = formatLocalDate(tx.date);
    if (iso < start || iso > end) continue;

    const key = truncBucket(iso, bucket);
    totals.set(key, (totals.get(key) || 0) + (Number(tx.total) || 0));
  }

  return totals;
};

const mergeGpTraded = (buckets, gpTotals) => {
  if (!gpTotals?.size) return buckets;

  const byDate = new Map((buckets || []).map((row) => [row.bucket_date, { ...row }]));

  for (const [bucketDate, gpTraded] of gpTotals.entries()) {
    const row = byDate.get(bucketDate) || {
      bucket_date: bucketDate,
      profit_items: 0,
      profit_dump: 0,
      profit_referral: 0,
      profit_bonds: 0,
      gp_traded: 0,
      sell_basis: 0,
      by_category: {},
      sells_count: 0,
      wins_count: 0,
    };

    row.gp_traded = gpTraded;
    byDate.set(bucketDate, row);
  }

  return [...byDate.values()].sort((a, b) => a.bucket_date.localeCompare(b.bucket_date));
};

const addHashPart = (hash, value) => {
  const text = value == null ? '' : String(value);
  let next = hash;

  for (let index = 0; index < text.length; index += 1) {
    next ^= text.charCodeAt(index);
    next = Math.imul(next, 16777619);
  }

  next ^= 31;
  return Math.imul(next, 16777619);
};

const signatureFor = (rows = [], fields = []) => {
  if (!rows.length) return '0';

  let hash = 2166136261;

  for (const row of rows) {
    for (const field of fields) {
      hash = addHashPart(hash, field(row));
    }
  }

  return `${rows.length}-${(hash >>> 0).toString(36)}`;
};

const transactionSignatureFields = [
  (row) => row.id,
  (row) => row.stockId ?? row.stock_id,
  (row) => row.date,
  (row) => row.type,
  (row) => row.shares,
  (row) => row.price,
  (row) => row.total,
];

const stockSignatureFields = [
  (row) => row.id,
  (row) => row.category,
];

const profitHistorySignatureFields = [
  (row) => row.id,
  (row) => row.transactionId ?? row.transaction_id,
  (row) => row.stockId ?? row.stock_id,
  (row) => row.profitType ?? row.profit_type,
  (row) => row.amount,
  (row) => row.createdAt ?? row.created_at,
];

const signatureForFallbackData = (fallbackData) => [
  signatureFor(fallbackData?.transactions, transactionSignatureFields),
  signatureFor(fallbackData?.stocks, stockSignatureFields),
  signatureFor(fallbackData?.profitHistory, profitHistorySignatureFields),
].join('-');

const setCachedBuckets = (key, buckets) => {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, buckets);

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

export function aggregateBucketsLocally({ transactions, stocks, profitHistory, start, end, bucket }) {
  const stockMap = new Map((stocks || []).map((stock) => [stock.id, stock]));
  const txMap = new Map((transactions || []).map((tx) => [String(tx.id), tx]));
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
        sell_basis: 0,
        by_category: {},
        sells_count: 0,
        wins_count: 0,
      });
    }

    return buckets.get(key);
  };

  for (const tx of transactions || []) {
    const iso = formatLocalDate(tx.date);
    if (!inWindow(iso)) continue;

    const key = truncBucket(iso, bucket);
    const row = ensureBucket(key);
    row.gp_traded += Number(tx.total) || 0;
  }

  for (const profit of profitHistory || []) {
    const tx = txMap.get(String(profit.transaction_id ?? profit.transactionId ?? ''));
    const isoSource = profit.profit_type === 'stock' && tx?.date ? tx.date : profit.created_at;
    const iso = formatLocalDate(isoSource);
    if (!inWindow(iso)) continue;

    const key = truncBucket(iso, bucket);
    const row = ensureBucket(key);
    const amount = Number(profit.amount) || 0;

    if (profit.profit_type === 'stock') {
      const stockId = profit.stock_id ?? tx?.stock_id ?? tx?.stockId;
      const category = stockMap.get(stockId)?.category || 'Uncategorized';
      const sellTotal = Number(tx?.total) || 0;

      row.profit_items += amount;
      row.sell_basis += Math.max(0, sellTotal - amount);
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
  const fallbackSignature = signatureForFallbackData(fallbackData);

  useEffect(() => {
    if (!userId) {
      setState({ buckets: [], loading: false, error: null, fromFallback: false });
      return;
    }

    const hasFallbackData = Boolean(fallbackData);
    const cacheKey = [
      userId,
      start,
      end,
      bucket,
      'local',
      fallbackSignature,
    ].join('-');
    if (cache.has(cacheKey)) {
      setState({ buckets: cache.get(cacheKey), loading: false, error: null, fromFallback: false });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    const local = hasFallbackData
      ? aggregateBucketsLocally({ ...fallbackData, start, end, bucket })
      : [];
    setCachedBuckets(cacheKey, local);
    setState({ buckets: local, loading: false, error: null, fromFallback: false });
  }, [userId, start, end, bucket, fallbackData, fallbackSignature]);

  return state;
}

export const __clearAnalyticsCache = () => cache.clear();
