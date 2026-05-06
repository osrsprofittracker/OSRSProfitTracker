import { createContext, useContext } from 'react';
import { useStocks } from '../hooks/useStocks';

const StocksContext = createContext(null);

export function StocksProvider({ userId, children }) {
  const value = useStocks(userId);
  return <StocksContext.Provider value={value}>{children}</StocksContext.Provider>;
}

export function useStocksContext() {
  const ctx = useContext(StocksContext);
  if (!ctx) throw new Error('useStocksContext must be used within StocksProvider');
  return ctx;
}
