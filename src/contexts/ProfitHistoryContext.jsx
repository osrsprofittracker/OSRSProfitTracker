import { createContext, useContext } from 'react';
import { useProfitHistory } from '../hooks/useProfitHistory';

const ProfitHistoryContext = createContext(null);

export function ProfitHistoryProvider({ userId, children }) {
  const value = useProfitHistory(userId);
  return <ProfitHistoryContext.Provider value={value}>{children}</ProfitHistoryContext.Provider>;
}

export function useProfitHistoryContext() {
  const ctx = useContext(ProfitHistoryContext);
  if (!ctx) throw new Error('useProfitHistoryContext must be used within ProfitHistoryProvider');
  return ctx;
}
