import { calculateUnrealizedProfit } from './taxUtils';

export const isoOf = (value) => String(value || '').slice(0, 10);
export const stockIdOf = (row) => row?.stockId ?? row?.stock_id;
export const transactionIdOf = (row) => row?.transactionId ?? row?.transaction_id;
export const profitTypeOf = (row) => row?.profitType ?? row?.profit_type;

const inWindow = (iso, start, end) => Boolean(iso) && iso >= start && iso <= end;

export function buildStockProfitByTransaction(profitHistory = []) {
  const profitByTx = new Map();

  for (const row of profitHistory || []) {
    if (profitTypeOf(row) !== 'stock') continue;

    const transactionId = transactionIdOf(row);
    if (transactionId == null) continue;

    const key = String(transactionId);
    profitByTx.set(key, (profitByTx.get(key) || 0) + (Number(row.amount) || 0));
  }

  return profitByTx;
}

export function computeItemMetrics({
  stocks = [],
  transactions = [],
  gePrices = {},
  start,
  end,
}) {
  const byStock = new Map();

  for (const stock of stocks || []) {
    const latestHigh = stock.itemId ? gePrices?.[stock.itemId]?.high : null;

    byStock.set(String(stock.id), {
      ...stock,
      category: stock.category || 'Uncategorized',
      shares: Number(stock.shares) || 0,
      totalCost: Number(stock.totalCost) || 0,
      sharesSold: Number(stock.sharesSold) || 0,
      totalCostSold: Number(stock.totalCostSold) || 0,
      totalCostBasisSold: Number(stock.totalCostBasisSold) || 0,
      totalProfit: (Number(stock.totalCostSold) || 0) - (Number(stock.totalCostBasisSold) || 0),
      marginPct: Number(stock.totalCostBasisSold) > 0
        ? (((Number(stock.totalCostSold) || 0) - (Number(stock.totalCostBasisSold) || 0)) / Number(stock.totalCostBasisSold)) * 100
        : 0,
      latestHigh,
      unrealizedProfit: calculateUnrealizedProfit(stock, latestHigh, stock.itemId),
      windowGpTraded: 0,
      windowBuyVolume: 0,
      windowSellVolume: 0,
      windowBuys: 0,
      windowSells: 0,
      hasWindowSellActivity: false,
      lastSellDate: null,
    });
  }

  for (const tx of transactions || []) {
    const stockId = stockIdOf(tx);
    const item = byStock.get(String(stockId));
    if (!item) continue;

    const iso = isoOf(tx.date);
    const total = Number(tx.total) || 0;
    const type = tx.type;

    if (type === 'buy') {
      if (inWindow(iso, start, end)) {
        item.windowBuys += 1;
        item.windowBuyVolume += total;
        item.windowGpTraded += total;
      }
      continue;
    }

    if (type === 'sell') {
      if (!item.lastSellDate || iso > item.lastSellDate) item.lastSellDate = iso;
      if (inWindow(iso, start, end)) {
        item.windowSells += 1;
        item.windowSellVolume += total;
        item.windowGpTraded += total;
        item.hasWindowSellActivity = true;
      }
    }
  }

  return [...byStock.values()];
}

export function computeMovers(items = [], count = 5) {
  return {
    gainers: [...items]
      .sort((a, b) => (Number(b.totalProfit) || 0) - (Number(a.totalProfit) || 0))
      .slice(0, count),
  };
}

export function computeBuyingVsSelling({ stocks = [] }) {
  return (stocks || [])
    .map((stock) => {
      const buys = (Number(stock.totalCost) || 0) + (Number(stock.totalCostBasisSold) || 0);
      const sells = Number(stock.totalCostSold) || 0;

      return {
        id: stock.id,
        name: stock.name,
        buys,
        sells,
        net: sells - buys,
      };
    })
    .filter((item) => item.buys > 0 || item.sells > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

export function buildDailyItemProfit({ itemId, transactions = [], profitHistory = [], start, end }) {
  const profitByTx = buildStockProfitByTransaction(profitHistory);
  const byDay = new Map();
  const dates = [];
  let heldShares = 0;
  let heldCost = 0;

  const itemTransactions = (transactions || [])
    .filter((tx) => String(stockIdOf(tx)) === String(itemId))
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  for (const tx of itemTransactions) {
    const shares = Number(tx.shares) || 0;
    const total = Number(tx.total) || 0;

    if (tx.type === 'buy') {
      heldShares += shares;
      heldCost += total;
      continue;
    }

    const iso = isoOf(tx.date);
    if (tx.type !== 'sell') continue;

    const averageCost = heldShares > 0 ? heldCost / heldShares : 0;
    const estimatedBasis = averageCost * shares;
    heldShares = Math.max(0, heldShares - shares);
    heldCost = Math.max(0, heldCost - estimatedBasis);

    if (start && end && !inWindow(iso, start, end)) continue;
    dates.push(iso);

    const txKey = String(tx.id);
    const profit = profitByTx.has(txKey)
      ? profitByTx.get(txKey)
      : total - estimatedBasis;

    byDay.set(iso, (byDay.get(iso) || 0) + profit);
  }

  if (!dates.length && (!start || !end)) return [];

  const startDateIso = start || dates.sort()[0];
  const endDateIso = end || dates[dates.length - 1];
  const rows = [];
  const cursor = new Date(`${startDateIso}T00:00:00Z`);
  const endDate = new Date(`${endDateIso}T00:00:00Z`);

  while (cursor <= endDate) {
    const date = cursor.toISOString().slice(0, 10);
    rows.push({ date, profit: byDay.get(date) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return rows;
}

export function getItemTransactions({ itemId, transactions = [], limit = 12 }) {
  return (transactions || [])
    .filter((tx) => String(stockIdOf(tx)) === String(itemId))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, limit);
}
