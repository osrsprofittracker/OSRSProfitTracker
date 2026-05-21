import { useMemo } from 'react';

/**
 * Groups stocks by category in category order, appending uncategorized at the end.
 * Returns an array of { name: string, stocks: Stock[] }.
 *
 * @param {Stock[]} stocks
 * @param {Category[]} categories
 * @param {'trade'|'investment'|'all'} tradeMode
 * @param {{ requireShares?: boolean, preferredTradeMode?: 'trade'|'investment' }} options
 */
export function useGroupedStocks(
  stocks,
  categories = [],
  tradeMode = 'trade',
  { requireShares = false, preferredTradeMode = 'trade' } = {}
) {
  return useMemo(() => {
    const matchesMode = (item) => {
      if (tradeMode === 'all') return true;
      return tradeMode === 'investment' ? item.isInvestment : !item.isInvestment;
    };

    if (tradeMode === 'all') {
      const filteredCats = categories.filter(matchesMode);
      const filtered = stocks.filter(s => matchesMode(s) && (!requireShares || s.shares > 0));
      const groups = [];
      const modeOrder = preferredTradeMode === 'investment'
        ? [true, false]
        : [false, true];

      for (const isInvestment of modeOrder) {
        const modeLabel = isInvestment ? 'Investments' : 'Trading';
        const modeCategories = filteredCats.filter(c =>
          Boolean(c.isInvestment) === isInvestment && c.name !== 'Uncategorized'
        );

        for (const cat of modeCategories) {
          const catStocks = filtered.filter(s =>
            s.category === cat.name && Boolean(s.isInvestment) === isInvestment
          );

          if (catStocks.length > 0) {
            groups.push({
              name: `${modeLabel}:${cat.name}`,
              label: `${modeLabel} / ${cat.name}`,
              stocks: catStocks,
            });
          }
        }

        const catNames = filteredCats
          .filter(c => Boolean(c.isInvestment) === isInvestment)
          .map(c => c.name);

        const uncategorized = filtered.filter(s =>
          Boolean(s.isInvestment) === isInvestment &&
          (s.category === 'Uncategorized' || !s.category || !catNames.includes(s.category))
        );

        if (uncategorized.length > 0) {
          groups.push({
            name: `${modeLabel}:Uncategorized`,
            label: `${modeLabel} / Uncategorized`,
            stocks: uncategorized,
          });
        }
      }

      return groups;
    }

    const filteredCats = categories.filter(c =>
      matchesMode(c)
    );
    const catNames = filteredCats.map(c => c.name);

    const filtered = stocks.filter(s => {
      const modeMatch = matchesMode(s);
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
  }, [stocks, categories, tradeMode, requireShares, preferredTradeMode]);
}
