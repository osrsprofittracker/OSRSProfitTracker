import { createContext, useContext, useMemo } from 'react';

const TRADE_DEFAULT = { stocks: [], categories: [], refetchStocks: () => {}, refetchCategories: () => {} };
const TradeContext = createContext(TRADE_DEFAULT);

export function TradeProvider({ stocks, categories, refetchStocks, refetchCategories, children }) {
  const value = useMemo(
    () => ({ stocks, categories, refetchStocks, refetchCategories }),
    [stocks, categories, refetchStocks, refetchCategories]
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
