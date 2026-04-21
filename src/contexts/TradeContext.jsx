import { createContext, useContext, useMemo } from 'react';

const TRADE_DEFAULT = {
  stocks: [],
  allStocks: [],
  categories: [],
  refetchStocks: () => {},
  refetchCategories: () => {},
};
const TradeContext = createContext(TRADE_DEFAULT);

export function TradeProvider({ stocks, allStocks = [], categories, refetchStocks, refetchCategories, children }) {
  const value = useMemo(
    () => ({ stocks, allStocks, categories, refetchStocks, refetchCategories }),
    [stocks, allStocks, categories, refetchStocks, refetchCategories]
  );

  return (
    <TradeContext.Provider value={value}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  return useContext(TradeContext);
}
