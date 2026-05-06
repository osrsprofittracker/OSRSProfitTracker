import { createContext, useContext } from 'react';
import { useCategories } from '../hooks/useCategories';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ userId, children }) {
  const value = useCategories(userId);
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategoriesContext must be used within CategoriesProvider');
  return ctx;
}
