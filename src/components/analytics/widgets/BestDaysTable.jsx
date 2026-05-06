import React, { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';
import {
  addDays,
  parseIsoDateUtc,
  periodSpanDays,
  subtractDays,
  toIsoDate,
  totalProfit,
} from '../../../utils/analyticsHelpers';

const TIMEFRAMES = ['1W', '1M', '3M', '6M', '1Y', 'All'];
const PERIODS = [
  { key: 'day', label: 'Days' },
  { key: 'week', label: 'Weeks' },
  { key: 'month', label: 'Months' },
  { key: 'year', label: 'Years' },
];

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
    default:
      return null;
  }
};

const startOfWeek = (iso) => {
  const date = parseIsoDateUtc(iso);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return toIsoDate(date);
};

const endOfMonth = (iso) => {
  const date = parseIsoDateUtc(`${iso.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return toIsoDate(date);
};

const endOfYear = (iso) => `${iso.slice(0, 4)}-12-31`;

const keyForPeriod = (iso, period) => {
  if (period === 'week') return startOfWeek(iso);
  if (period === 'month') return `${iso.slice(0, 7)}-01`;
  if (period === 'year') return `${iso.slice(0, 4)}-01-01`;
  return iso;
};

const endForPeriod = (start, period) => {
  if (period === 'week') return addDays(start, 6);
  if (period === 'month') return endOfMonth(start);
  if (period === 'year') return endOfYear(start);
  return start;
};

const labelForPeriod = (start, period) => {
  if (period === 'week') return `${start} to ${endForPeriod(start, period)}`;
  if (period === 'month') return start.slice(0, 7);
  if (period === 'year') return start.slice(0, 4);
  return start;
};

const availablePeriodsForSpan = (spanDays) => (
  PERIODS.filter((option) => {
    if (option.key === 'year') return spanDays >= 365;
    if (option.key === 'month') return spanDays >= 30;
    if (option.key === 'week') return spanDays >= 7;
    return true;
  })
);

const getStockId = (transaction) => transaction.stockId ?? transaction.stock_id;
const getStockName = (transaction) => transaction.stockName ?? transaction.stock_name ?? 'Unknown';
const getProfitType = (profit) => profit.profit_type ?? profit.profitType;
const getProfitTxId = (profit) => profit.transaction_id ?? profit.transactionId;
const getProfitStockId = (profit) => profit.stock_id ?? profit.stockId;
const getProfitDate = (profit) => profit.created_at ?? profit.createdAt;

function buildTopItemsByPeriod(transactions, stocks, profitHistory, period, startDate, endDate) {
  const stockMap = new Map(stocks.map((stock) => [stock.id, stock]));
  const txMap = new Map(transactions.map((transaction) => [String(transaction.id), transaction]));
  const profitGrouped = new Map();
  const volumeGrouped = new Map();

  for (const profitEntry of profitHistory) {
    if (getProfitType(profitEntry) !== 'stock') continue;

    const tx = txMap.get(String(getProfitTxId(profitEntry)));
    const iso = String(tx?.date || getProfitDate(profitEntry) || '').slice(0, 10);
    if (!iso) continue;
    if (startDate && iso < startDate) continue;
    if (endDate && iso > endDate) continue;

    const stockId = getProfitStockId(profitEntry) ?? (tx ? getStockId(tx) : null);
    const stock = stockMap.get(stockId);
    const name = stock?.name || (tx ? getStockName(tx) : 'Unknown');
    const key = keyForPeriod(iso, period);

    if (!profitGrouped.has(key)) profitGrouped.set(key, new Map());
    const itemSums = profitGrouped.get(key);
    itemSums.set(name, (itemSums.get(name) || 0) + (Number(profitEntry.amount) || 0));
  }

  for (const transaction of transactions) {
    if (transaction.type !== 'sell') continue;

    const iso = String(transaction.date || '').slice(0, 10);
    if (!iso) continue;
    if (startDate && iso < startDate) continue;
    if (endDate && iso > endDate) continue;

    const stock = stockMap.get(getStockId(transaction));
    const name = stock?.name || getStockName(transaction);
    const key = keyForPeriod(iso, period);

    if (!volumeGrouped.has(key)) volumeGrouped.set(key, new Map());
    const volumeSums = volumeGrouped.get(key);
    volumeSums.set(name, (volumeSums.get(name) || 0) + (Number(transaction.total) || 0));
  }

  const bestByPeriod = new Map();
  const keys = new Set([...profitGrouped.keys(), ...volumeGrouped.keys()]);
  for (const key of keys) {
    const itemSums = profitGrouped.get(key) || new Map();
    let best = null;
    for (const [name, profit] of itemSums.entries()) {
      if (!best || profit > best.profit) best = { name, profit };
    }
    if (best && best.profit !== 0) {
      bestByPeriod.set(key, best.name);
      continue;
    }

    let bestByVolume = null;
    for (const [name, total] of (volumeGrouped.get(key) || new Map()).entries()) {
      if (!bestByVolume || total > bestByVolume.total) bestByVolume = { name, total };
    }
    if (bestByVolume) bestByPeriod.set(key, bestByVolume.name);
  }

  return bestByPeriod;
}

function aggregateBuckets(dailyBuckets, period) {
  const grouped = new Map();

  for (const bucket of dailyBuckets) {
    const key = keyForPeriod(bucket.bucket_date, period);
    const current = grouped.get(key) || {
      date: key,
      endDate: endForPeriod(key, period),
      label: labelForPeriod(key, period),
      profit: 0,
      sells: 0,
    };

    current.profit += totalProfit(bucket);
    current.sells += Number(bucket.sells_count || 0);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.profit - a.profit).slice(0, 5);
}

function Row({ row, topItem, numberFormat, onNavigateToHistory }) {
  const clickable = Boolean(onNavigateToHistory);

  return (
    <tr
      className={`analytics-bw-row${clickable ? ' is-clickable' : ''}`}
      onClick={() => onNavigateToHistory?.(row.date, row.endDate)}
    >
      <td>{row.label}</td>
      <td className={row.profit >= 0 ? 'analytics-profit-positive' : 'analytics-profit-negative'}>
        {formatNumber(row.profit, numberFormat)}
      </td>
      <td>{row.sells}</td>
      <td>{topItem || '-'}</td>
    </tr>
  );
}

export default function BestDaysTable({
  allBuckets = [],
  transactions = [],
  stocks = [],
  profitHistory = [],
  endDate,
  numberFormat,
  onNavigateToHistory,
}) {
  const [window, setWindow] = useState('1Y');
  const [period, setPeriod] = useState('day');
  const startDate = useMemo(() => {
    if (window === 'All') return allBuckets[0]?.bucket_date || endDate;

    const days = daysForWindow(window);
    return days == null ? allBuckets[0]?.bucket_date || endDate : subtractDays(endDate, days);
  }, [allBuckets, endDate, window]);
  const selectedBuckets = useMemo(() => (
    allBuckets.filter((bucket) => (
      bucket.bucket_date >= startDate && bucket.bucket_date <= endDate
    ))
  ), [allBuckets, startDate, endDate]);
  const spanDays = useMemo(() => periodSpanDays(startDate, endDate), [startDate, endDate]);
  const availablePeriods = useMemo(() => availablePeriodsForSpan(spanDays), [spanDays]);

  useEffect(() => {
    if (!availablePeriods.some((option) => option.key === period)) {
      setPeriod(availablePeriods[availablePeriods.length - 1]?.key || 'day');
    }
  }, [availablePeriods, period]);

  const rows = useMemo(() => aggregateBuckets(selectedBuckets, period), [selectedBuckets, period]);
  const topItems = useMemo(
    () => buildTopItemsByPeriod(transactions, stocks, profitHistory, period, startDate, endDate),
    [transactions, stocks, profitHistory, period, startDate, endDate]
  );

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Ranks the best profit periods inside the selected timeframe. Use the buttons to group by day, week, month, or year."
        >
          Best profit periods
        </h3>
        <div className="analytics-widget-controls">
          <div className="analytics-segmented" aria-label="Best periods timeframe">
            {TIMEFRAMES.map((option) => (
              <button
                key={option}
                type="button"
                className={`analytics-segmented-btn has-tooltip${window === option ? ' is-active' : ''}`}
                data-tooltip={`Rank best periods using ${option === 'All' ? 'all available history' : `the last ${option}`}.`}
                onClick={() => setWindow(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="analytics-segmented" aria-label="Best period grouping">
            {availablePeriods.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`analytics-segmented-btn has-tooltip${period === option.key ? ' is-active' : ''}`}
                data-tooltip={`Group this best-period table by ${option.label.toLowerCase()}.`}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="analytics-widget-body">
        {rows.length === 0 ? (
          <div className="analytics-widget-empty">No profit activity in this window.</div>
        ) : (
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Profit</th>
                <th>Sells</th>
                <th>Top item</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Row
                  key={row.date}
                  row={row}
                  topItem={topItems.get(row.date)}
                  numberFormat={numberFormat}
                  onNavigateToHistory={onNavigateToHistory}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
