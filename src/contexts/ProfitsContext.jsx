import { createContext, useContext } from 'react';
import { useProfits } from '../hooks/useProfits';

const ProfitsContext = createContext(null);

export function ProfitsProvider({ userId, children }) {
  const value = useProfits(userId);
  return <ProfitsContext.Provider value={value}>{children}</ProfitsContext.Provider>;
}

export function useProfitsContext() {
  const ctx = useContext(ProfitsContext);
  if (!ctx) throw new Error('useProfitsContext must be used within ProfitsProvider');
  return ctx;
}
