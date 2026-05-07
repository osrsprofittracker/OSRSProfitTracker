import { calculateUnrealizedProfit } from './taxUtils';
import { applyAverageCostExit } from './positionAnalytics';

const DEFAULT_CATEGORY = 'Uncategorized';

const toNumber = (value) => Number(value) || 0;

const categoryOf = (stock) => stock?.category || DEFAULT_CATEGORY;

const itemIdOf = (stock) => stock?.itemId ?? stock?.item_id;
const stockIdOf = (row) => row?.stockId ?? row?.stock_id;
const transactionIdOf = (row) => row?.transactionId ?? row?.transaction_id;
const profitTypeOf = (row) => row?.profitType ?? row?.profit_type;
const isoOf = (value) => String(value || '').slice(0, 10);

const MS_PER_DAY = 86400000;

const parseIsoDateUtc = (iso) => {
  const [year, month, day] = String(iso || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (iso, days) => {
  const date = parseIsoDateUtc(iso);
  if (!date) return iso;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const enumerateDays = (start, end) => {
  const startDate = parseIsoDateUtc(start);
  const endDate = parseIsoDateUtc(end);
  if (!startDate || !endDate || startDate > endDate) return [];

  const days = [];
  const span = Math.round((endDate - startDate) / MS_PER_DAY);
  for (let offset = 0; offset <= span; offset += 1) {
    days.push(addDays(start, offset));
  }
  return days;
};

const isTradeType = (type) => type === 'buy' || type === 'sell';
const isInventoryType = (type) => isTradeType(type) || type === 'remove';

const latestHighOf = (stock, gePrices) => {
  const itemId = itemIdOf(stock);
  return itemId ? gePrices?.[itemId]?.high : null;
};

const emptyCategoryRow = (category) => ({
  category,
  uniqueItems: 0,
  inventoryValue: 0,
  currentQuantity: 0,
  totalRealized: 0,
  basis: 0,
  soldQuantity: 0,
  gpTradedAllTime: 0,
  gpTradedWindow: 0,
  unrealizedProfit: 0,
  windowBasis: 0,
  windowProfit: 0,
  tradesWindow: 0,
  avgInventoryWindow: 0,
  turnoverPct: null,
});

const ensureCategory = (map, category) => {
  if (!map.has(category)) map.set(category, emptyCategoryRow(category));
  return map.get(category);
};

const CATEGORY_COLORS = [
  'rgb(96, 165, 250)',
  'rgb(52, 211, 153)',
  'rgb(168, 85, 247)',
  'rgb(251, 146, 60)',
  'rgb(234, 179, 8)',
  'rgb(239, 68, 68)',
  'rgb(34, 197, 94)',
  'rgb(244, 114, 182)',
  'rgb(45, 212, 191)',
  'rgb(250, 204, 21)',
  'rgb(14, 165, 233)',
  'rgb(132, 204, 22)',
  'rgb(217, 70, 239)',
  'rgb(245, 158, 11)',
  'rgb(99, 102, 241)',
  'rgb(16, 185, 129)',
  'rgb(236, 72, 153)',
  'rgb(148, 163, 184)',
  'rgb(248, 113, 113)',
  'rgb(34, 211, 238)',
];

export const getCategoryColorIndex = (category) => {
  if (Number.isFinite(Number(category))) return Number(category) % CATEGORY_COLORS.length;

  const text = String(category || DEFAULT_CATEGORY);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) % CATEGORY_COLORS.length;
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[getCategoryColorIndex(category)];
};

export function filterBucketsByCategories(buckets = [], selectedCategories = []) {
  if (!selectedCategories.length) return buckets;
  const selected = new Set(selectedCategories);

  return buckets.map((bucket) => {
    const byCategory = {};

    for (const [category, value] of Object.entries(bucket.by_category || {})) {
      if (selected.has(category)) byCategory[category] = value;
    }

    return {
      ...bucket,
      by_category: byCategory,
    };
  });
}

export function pivotCategoryTimeseries(buckets = []) {
  const categorySet = new Set();

  for (const bucket of buckets) {
    for (const category of Object.keys(bucket.by_category || {})) {
      categorySet.add(category);
    }
  }

  const categories = [...categorySet].sort();
  const rows = buckets.map((bucket) => {
    const row = { date: bucket.bucket_date };

    for (const category of categories) {
      row[category] = toNumber(bucket.by_category?.[category]);
    }

    return row;
  });

  return { rows, categories };
}

export function getCategoryStackDomain(rows = [], categories = []) {
  let maxPositive = 0;
  let minNegative = 0;

  for (const row of rows) {
    let positive = 0;
    let negative = 0;

    for (const category of categories) {
      const value = toNumber(row[category]);
      if (value >= 0) positive += value;
      else negative += value;
    }

    maxPositive = Math.max(maxPositive, positive);
    minNegative = Math.min(minNegative, negative);
  }

  const top = maxPositive > 0 ? Math.ceil(maxPositive * 1.08) : 1;
  if (minNegative < 0) return [Math.floor(minNegative * 1.08), top];
  return [0, top];
}

const buildProfitByTransaction = (profitHistory = []) => {
  const map = new Map();

  for (const row of profitHistory || []) {
    if (profitTypeOf(row) !== 'stock') continue;
    const id = transactionIdOf(row);
    if (id == null) continue;
    map.set(String(id), (map.get(String(id)) || 0) + toNumber(row.amount));
  }

  return map;
};

const addTransactionWindowMetrics = ({
  byCategory,
  stocks,
  transactions,
  profitHistory,
  start,
  end,
}) => {
  if (!start || !end) return;

  const stocksById = new Map((stocks || []).map((stock) => [String(stock.id), stock]));
  const profitByTransaction = buildProfitByTransaction(profitHistory);
  const positions = new Map();
  const sortedTransactions = [...(transactions || [])]
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  for (const transaction of sortedTransactions) {
    const stock = stocksById.get(String(stockIdOf(transaction)));
    if (!stock) continue;

    const category = categoryOf(stock);
    const row = ensureCategory(byCategory, category);
    const iso = isoOf(transaction.date);
    const shares = toNumber(transaction.shares);
    const total = toNumber(transaction.total);
    const inWindow = iso >= start && iso <= end;
    const positionKey = String(stock.id);
    const position = positions.get(positionKey) || { shares: 0, cost: 0 };

    if (inWindow && isTradeType(transaction.type)) {
      row.gpTradedWindow += total;
      row.tradesWindow += 1;
    }

    if (transaction.type === 'buy') {
      position.shares += shares;
      position.cost += total;
      positions.set(positionKey, position);
      continue;
    }

    if (transaction.type === 'remove') {
      const nextPosition = applyAverageCostExit(position, shares);
      position.shares = nextPosition.shares;
      position.cost = nextPosition.cost;
      positions.set(positionKey, position);
      continue;
    }

    if (transaction.type !== 'sell') {
      positions.set(positionKey, position);
      continue;
    }

    const nextPosition = applyAverageCostExit(position, shares);
    const estimatedBasis = nextPosition.estimatedBasis;
    const transactionProfit = profitByTransaction.has(String(transaction.id))
      ? profitByTransaction.get(String(transaction.id))
      : total - estimatedBasis;
    const basis = Math.max(0, total - transactionProfit);

    if (inWindow) row.windowBasis += basis;

    position.shares = nextPosition.shares;
    position.cost = nextPosition.cost;
    positions.set(positionKey, position);
  }
};

export function computeCategoryAverageInventory({
  stocks = [],
  transactions = [],
  start,
  end,
}) {
  if (!start || !end) return new Map();

  const days = enumerateDays(start, end);
  if (!days.length) return new Map();

  const stocksById = new Map((stocks || []).map((stock) => [String(stock.id), stock]));
  const stocksWithHistory = new Set(
    (transactions || [])
      .filter((transaction) => isInventoryType(transaction.type))
      .filter((transaction) => {
        const iso = isoOf(transaction.date);
        return iso && iso <= end && stocksById.has(String(stockIdOf(transaction)));
      })
      .map((transaction) => String(stockIdOf(transaction)))
  );
  const positions = new Map((stocks || []).map((stock) => [
    String(stock.id),
    {
      stock,
      shares: stocksWithHistory.has(String(stock.id)) ? 0 : toNumber(stock.shares),
      cost: stocksWithHistory.has(String(stock.id)) ? 0 : toNumber(stock.totalCost),
    },
  ]));
  const sortedTransactions = [...(transactions || [])]
    .filter((transaction) => stocksById.has(String(stockIdOf(transaction))))
    .filter((transaction) => isInventoryType(transaction.type))
    .filter((transaction) => Boolean(isoOf(transaction.date)))
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  let txIndex = 0;
  const totals = new Map();

  for (const day of days) {
    while (
      txIndex < sortedTransactions.length
      && isoOf(sortedTransactions[txIndex].date) <= day
    ) {
      const transaction = sortedTransactions[txIndex];
      const stock = stocksById.get(String(stockIdOf(transaction)));
      const key = String(stock.id);
      const position = positions.get(key) || { stock, shares: 0, cost: 0 };
      const shares = toNumber(transaction.shares);
      const total = toNumber(transaction.total);

      if (transaction.type === 'buy') {
        position.shares += shares;
        position.cost += total;
      }

      if (transaction.type === 'sell' || transaction.type === 'remove') {
        const nextPosition = applyAverageCostExit(position, shares);
        position.shares = nextPosition.shares;
        position.cost = nextPosition.cost;
      }

      positions.set(key, position);
      txIndex += 1;
    }

    for (const position of positions.values()) {
      const category = categoryOf(position.stock);
      totals.set(category, (totals.get(category) || 0) + Math.max(0, position.cost));
    }
  }

  const averages = new Map();
  for (const [category, total] of totals.entries()) {
    averages.set(category, total / days.length);
  }

  return averages;
}

export function computeCategoryBreakdown({
  stocks = [],
  buckets = [],
  gePrices = {},
  transactions = [],
  profitHistory = [],
  start,
  end,
}) {
  const byCategory = new Map();

  for (const stock of stocks || []) {
    const category = categoryOf(stock);
    const row = ensureCategory(byCategory, category);
    const totalCost = toNumber(stock.totalCost);
    const totalCostSold = toNumber(stock.totalCostSold);
    const totalCostBasisSold = toNumber(stock.totalCostBasisSold);

    row.uniqueItems += 1;
    row.inventoryValue += totalCost;
    row.currentQuantity += toNumber(stock.shares);
    row.totalRealized += totalCostSold - totalCostBasisSold;
    row.basis += totalCostBasisSold;
    row.soldQuantity += toNumber(stock.sharesSold);
    row.gpTradedAllTime += totalCost + totalCostSold;
    row.unrealizedProfit += toNumber(
      calculateUnrealizedProfit(stock, latestHighOf(stock, gePrices), itemIdOf(stock))
    );
  }

  for (const bucket of buckets || []) {
    for (const [category, profit] of Object.entries(bucket.by_category || {})) {
      ensureCategory(byCategory, category).windowProfit += toNumber(profit);
    }
  }

  addTransactionWindowMetrics({
    byCategory,
    stocks,
    transactions,
    profitHistory,
    start,
    end,
  });

  const avgInventoryByCategory = computeCategoryAverageInventory({
    stocks,
    transactions,
    start,
    end,
  });

  for (const [category, avgInventory] of avgInventoryByCategory.entries()) {
    ensureCategory(byCategory, category).avgInventoryWindow = avgInventory;
  }

  return [...byCategory.values()]
    .map((row) => {
      let turnoverPct = null;
      if (row.avgInventoryWindow > 0) {
        turnoverPct = (row.windowProfit / row.avgInventoryWindow) * 100;
      } else if (row.windowProfit === 0) {
        turnoverPct = 0;
      }

      return {
        ...row,
        avgMarginPct: row.windowBasis > 0 ? (row.windowProfit / row.windowBasis) * 100 : 0,
        turnoverPct,
      };
    })
    .sort((a, b) => b.windowProfit - a.windowProfit);
}

export function computeCategoryShareSnapshot({ stocks = [], metric = 'totalCost', gePrices = {} }) {
  const byCategory = new Map();

  for (const stock of stocks || []) {
    const category = categoryOf(stock);
    let value = 0;

    if (metric === 'totalCost') value = toNumber(stock.totalCost);
    if (metric === 'shares') value = toNumber(stock.shares);
    if (metric === 'profit') {
      value = toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold);
    }
    if (metric === 'soldCost') value = toNumber(stock.totalCostSold);
    if (metric === 'soldShares') value = toNumber(stock.sharesSold);
    if (metric === 'unrealizedProfit') {
      value = toNumber(calculateUnrealizedProfit(stock, latestHighOf(stock, gePrices), itemIdOf(stock)));
    }

    byCategory.set(category, (byCategory.get(category) || 0) + value);
  }

  return [...byCategory.entries()]
    .map(([name, value]) => ({
      name,
      value,
      chartValue: metric === 'unrealizedProfit' ? Math.abs(value) : value,
    }))
    .filter((slice) => (metric === 'unrealizedProfit' ? slice.value !== 0 : slice.value > 0))
    .sort((a, b) => (
      metric === 'unrealizedProfit'
        ? b.value - a.value
        : b.chartValue - a.chartValue
    ));
}

export function computeCategoryContribution(buckets = [], categories = []) {
  const totals = new Map();

  for (const category of categories || []) {
    totals.set(category, 0);
  }

  for (const bucket of buckets || []) {
    for (const [category, profit] of Object.entries(bucket.by_category || {})) {
      totals.set(category, (totals.get(category) || 0) + toNumber(profit));
    }
  }

  const grandTotal = [...totals.values()].reduce((sum, value) => sum + Math.abs(value), 0);

  return [...totals.entries()]
    .map(([category, profit]) => ({
      category,
      profit,
      pct: grandTotal > 0 ? (Math.abs(profit) / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));
}

export function computeInventoryByCategory(stocks = []) {
  const byCategory = new Map();

  for (const stock of stocks || []) {
    const category = categoryOf(stock);
    byCategory.set(category, (byCategory.get(category) || 0) + toNumber(stock.totalCost));
  }

  return [...byCategory.entries()]
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function sumBucketsByCategory(buckets = []) {
  const totals = new Map();

  for (const bucket of buckets || []) {
    for (const [category, profit] of Object.entries(bucket.by_category || {})) {
      totals.set(category, (totals.get(category) || 0) + toNumber(profit));
    }
  }

  return totals;
}

export function buildCategoryHeatmapRows({ buckets = [], categories = [] }) {
  const categorySet = new Set(categories || []);

  if (categorySet.size === 0) {
    for (const bucket of buckets || []) {
      for (const category of Object.keys(bucket.by_category || {})) {
        categorySet.add(category);
      }
    }
  }

  const dates = (buckets || []).map((bucket) => bucket.bucket_date).filter(Boolean);
  const bucketsByDate = new Map((buckets || [])
    .filter((bucket) => bucket.bucket_date)
    .map((bucket) => [bucket.bucket_date, bucket]));

  return [...categorySet].sort().map((category) => ({
    category,
    cells: dates.map((date) => {
      const bucket = bucketsByDate.get(date);
      return {
        date,
        profit: toNumber(bucket?.by_category?.[category]),
      };
    }),
  }));
}

export function buildCategoryDrilldownData({
  category,
  breakdownRows = [],
  buckets = [],
  stocks = [],
  transactions = [],
  profitHistory = [],
  start,
  end,
  limit = 12,
}) {
  const matchingStocks = (stocks || []).filter((stock) => categoryOf(stock) === category);
  const stockIds = new Set(matchingStocks.map((stock) => String(stock.id)));
  const stocksById = new Map(matchingStocks.map((stock) => [String(stock.id), stock]));
  const metrics = breakdownRows.find((row) => row.category === category) || emptyCategoryRow(category);
  const profitSeries = (buckets || []).map((bucket) => ({
    date: bucket.bucket_date,
    profit: toNumber(bucket.by_category?.[category]),
  }));
  const profitByTransaction = buildProfitByTransaction(profitHistory);
  const positions = new Map();
  const windowProfitByStock = new Map();
  const categoryTransactions = (transactions || [])
    .filter((transaction) => stockIds.has(String(stockIdOf(transaction))));

  for (const transaction of [...categoryTransactions].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))) {
    const stockId = String(stockIdOf(transaction));
    const position = positions.get(stockId) || { shares: 0, cost: 0 };
    const shares = toNumber(transaction.shares);
    const total = toNumber(transaction.total);

    if (transaction.type === 'buy') {
      position.shares += shares;
      position.cost += total;
      positions.set(stockId, position);
      continue;
    }

    if (transaction.type !== 'sell') {
      if (transaction.type === 'remove') {
        const nextPosition = applyAverageCostExit(position, shares);
        position.shares = nextPosition.shares;
        position.cost = nextPosition.cost;
      }
      positions.set(stockId, position);
      continue;
    }

    const nextPosition = applyAverageCostExit(position, shares);
    const estimatedBasis = nextPosition.estimatedBasis;
    const iso = isoOf(transaction.date);

    if (!start || !end || (iso >= start && iso <= end)) {
      const transactionProfit = profitByTransaction.has(String(transaction.id))
        ? profitByTransaction.get(String(transaction.id))
        : total - estimatedBasis;
      windowProfitByStock.set(stockId, (windowProfitByStock.get(stockId) || 0) + transactionProfit);
    }

    position.shares = nextPosition.shares;
    position.cost = nextPosition.cost;
    positions.set(stockId, position);
  }

  const recentTransactions = (transactions || [])
    .filter((transaction) => stockIds.has(String(stockIdOf(transaction))))
    .filter((transaction) => isTradeType(transaction.type))
    .map((transaction) => ({
      ...transaction,
      itemName: stocksById.get(String(stockIdOf(transaction)))?.name || 'Unknown item',
    }))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, limit);
  const windowTransactions = (transactions || [])
    .filter((transaction) => stockIds.has(String(stockIdOf(transaction))))
    .filter((transaction) => isTradeType(transaction.type))
    .filter((transaction) => {
      const iso = isoOf(transaction.date);
      return !start || !end || (iso >= start && iso <= end);
    });
  const topItems = matchingStocks
    .map((stock) => ({
      ...stock,
      windowGpTraded: windowTransactions
        .filter((transaction) => String(stockIdOf(transaction)) === String(stock.id))
        .reduce((sum, transaction) => sum + toNumber(transaction.total), 0),
      windowProfit: windowProfitByStock.get(String(stock.id)) || 0,
      totalRealized: toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold),
    }))
    .filter((stock) => (
      toNumber(stock.windowGpTraded) !== 0
      || toNumber(stock.windowProfit) !== 0
      || toNumber(stock.shares) !== 0
    ));

  return {
    category,
    metrics,
    profitSeries,
    topItems,
    recentTransactions,
  };
}
