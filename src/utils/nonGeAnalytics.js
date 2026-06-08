import { formatLocalDate } from './localPeriods';

const DEFAULT_CATEGORY = 'Uncategorized';

const toNumber = (value) => Number(value) || 0;
const isoOf = (value) => formatLocalDate(value);
const stockIdOf = (row) => row?.nonGeStockId ?? row?.non_ge_stock_id ?? row?.stockId ?? row?.stock_id;
const transactionIdOf = (row) => row?.transactionId ?? row?.transaction_id;
const profitTypeOf = (row) => row?.profitType ?? row?.profit_type;

export const isNonGEMarketRow = (row) => row?.market === 'non_ge';

export function categoryNameById(categories = []) {
  return new Map((categories || []).map((category) => [String(category.id), category.name]));
}

export function categoryNameForStock(stock, categoriesById) {
  const categoryId = stock?.categoryId ?? stock?.category_id;
  if (categoryId == null) return DEFAULT_CATEGORY;
  return categoriesById.get(String(categoryId)) || DEFAULT_CATEGORY;
}

export function normalizeNonGEStocks(stocks = [], categories = []) {
  const categoriesById = categoryNameById(categories);

  return (stocks || []).map((stock) => ({
    ...stock,
    id: stock.id,
    name: stock.nameSnapshot || stock.name || 'Unknown item',
    category: categoryNameForStock(stock, categoriesById),
    shares: toNumber(stock.shares),
    totalCost: toNumber(stock.totalCost),
    sharesSold: toNumber(stock.sharesSold),
    totalCostSold: toNumber(stock.totalCostSold),
    totalCostBasisSold: toNumber(stock.totalCostBasisSold),
    archived: Boolean(stock.archived),
  }));
}

export function normalizeNonGETransactions(transactions = []) {
  return (transactions || [])
    .filter(isNonGEMarketRow)
    .map((transaction) => {
      const stockId = stockIdOf(transaction);

      return {
        ...transaction,
        stockId,
        stock_id: stockId,
        shares: toNumber(transaction.shares),
        price: toNumber(transaction.price),
        total: toNumber(transaction.total),
      };
    });
}

export function normalizeNonGEProfitHistory(profitHistory = [], transactions = []) {
  const nonGETransactionsById = new Map(
    (transactions || []).map((transaction) => [String(transaction.id), transaction])
  );

  return (profitHistory || [])
    .filter((profit) => (
      isNonGEMarketRow(profit)
      || nonGETransactionsById.has(String(transactionIdOf(profit)))
    ))
    .map((profit) => {
      const linkedTransaction = nonGETransactionsById.get(String(transactionIdOf(profit)));
      const stockId = stockIdOf(profit) ?? stockIdOf(linkedTransaction);

      return {
        ...profit,
        market: 'non_ge',
        stockId,
        stock_id: stockId,
        transactionId: transactionIdOf(profit),
        transaction_id: transactionIdOf(profit),
        profitType: profitTypeOf(profit),
        profit_type: profitTypeOf(profit),
        amount: toNumber(profit.amount),
      };
    });
}

export function firstNonGEActivityDate(transactions = [], profitHistory = []) {
  const dates = [
    ...(transactions || []).map((transaction) => isoOf(transaction.date)),
    ...(profitHistory || []).map((profit) => isoOf(profit.createdAt ?? profit.created_at)),
  ].filter(Boolean);

  return dates.length > 0 ? dates.sort()[0] : null;
}

export function computeNonGETotalProfit(stocks = []) {
  return (stocks || []).reduce(
    (sum, stock) => sum + toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold),
    0
  );
}

export function computeNonGEInventoryValue(stocks = []) {
  return (stocks || []).reduce((sum, stock) => sum + toNumber(stock.totalCost), 0);
}

export function computeNonGEItems({
  stocks = [],
  transactions = [],
  start,
  end,
}) {
  const itemsById = new Map((stocks || []).map((stock) => [
    String(stock.id),
    {
      ...stock,
      totalProfit: toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold),
      marginPct: toNumber(stock.totalCostBasisSold) > 0
        ? ((toNumber(stock.totalCostSold) - toNumber(stock.totalCostBasisSold)) / toNumber(stock.totalCostBasisSold)) * 100
        : 0,
      buyBasis: toNumber(stock.totalCost) + toNumber(stock.totalCostBasisSold),
      sellValue: toNumber(stock.totalCostSold),
      windowGpTraded: 0,
      windowBuyVolume: 0,
      windowSellVolume: 0,
      windowBuys: 0,
        windowSells: 0,
        windowTrades: 0,
        soldBasis: toNumber(stock.totalCostBasisSold),
      },
  ]));

  for (const transaction of transactions || []) {
    const item = itemsById.get(String(stockIdOf(transaction)));
    if (!item) continue;

    const iso = isoOf(transaction.date);
    if (!iso || iso < start || iso > end) continue;

    const total = toNumber(transaction.total);
    if (transaction.type === 'buy') {
      item.windowBuys += 1;
      item.windowTrades += 1;
      item.windowBuyVolume += total;
      item.windowGpTraded += total;
    }

    if (transaction.type === 'sell') {
      item.windowSells += 1;
      item.windowTrades += 1;
      item.windowSellVolume += total;
      item.windowGpTraded += total;
    }
  }

  return [...itemsById.values()];
}

export function computeNonGEBuyingVsSelling(items = []) {
  return (items || [])
    .map((item) => ({
      id: item.id,
      name: item.name,
      buys: toNumber(item.buyBasis),
      sells: toNumber(item.sellValue),
      net: toNumber(item.sellValue) - toNumber(item.buyBasis),
    }))
    .filter((item) => item.buys > 0 || item.sells > 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

export function computeNonGECategoryRows({
  items = [],
  buckets = [],
}) {
  const rowsByCategory = new Map();

  const ensureRow = (category) => {
    const key = category || DEFAULT_CATEGORY;
    if (!rowsByCategory.has(key)) {
      rowsByCategory.set(key, {
        category: key,
        items: 0,
        inventoryValue: 0,
        totalProfit: 0,
        soldBasis: 0,
        gpTradedWindow: 0,
        tradesWindow: 0,
        windowProfit: 0,
        avgMarginPct: 0,
      });
    }

    return rowsByCategory.get(key);
  };

  for (const item of items || []) {
    const row = ensureRow(item.category);
    row.items += 1;
    row.inventoryValue += toNumber(item.totalCost);
    row.totalProfit += toNumber(item.totalProfit);
    row.soldBasis += toNumber(item.soldBasis);
    row.gpTradedWindow += toNumber(item.windowGpTraded);
    row.tradesWindow += toNumber(item.windowTrades);
  }

  for (const bucket of buckets || []) {
    for (const [category, profit] of Object.entries(bucket.by_category || {})) {
      ensureRow(category).windowProfit += toNumber(profit);
    }
  }

  return [...rowsByCategory.values()]
    .map((row) => ({
      ...row,
      avgMarginPct: row.soldBasis > 0 ? (row.totalProfit / row.soldBasis) * 100 : 0,
    }))
    .sort((a, b) => b.windowProfit - a.windowProfit);
}
