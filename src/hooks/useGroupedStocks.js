import { useMemo } from 'react';

/**
 * Groups stocks by category in category order, appending uncategorized at the end.
 * Returns an array of { name: string, stocks: Stock[] }.
 *
 * @param {Stock[]} stocks
 * @param {Category[]} categories
 * @param {'trade'|'investment'} tradeMode
 * @param {{ requireShares?: boolean }} options
 */
export function useGroupedStocks(stocks, categories = [], tradeMode = 'trade', { requireShares = false } = {}) {
  return useMemo(() => {
    const filteredCats = categories.filter(c =>
      tradeMode === 'investment' ? c.isInvestment : !c.isInvestment
    );
    const catNames = filteredCats.map(c => c.name);

    const filtered = stocks.filter(s => {
      const modeMatch = tradeMode === 'investment' ? s.isInvestment : !s.isInvestment;
      return modeMatch && (!requireShares || s.shares > 0);
    });

    const groups = [];
    for (const cat of filteredCats) {
      const catStocks = filtered.filter(s => s.category === cat.name);
      if (catStocks.length > 0) {
        groups.push({ name: cat.name, stocks: catStocks });
      }
    }

    const uncategorized = filtered.filter(s =>
      s.category === 'Uncategorized' || !s.category || !catNames.includes(s.category)
    );
    if (uncategorized.length > 0 && !filteredCats.some(c => c.name === 'Uncategorized')) {
      groups.push({ name: 'Uncategorized', stocks: uncategorized });
    }

    return groups;
  }, [stocks, categories, tradeMode, requireShares]);
}
