import { createContext, useContext, useMemo } from 'react';

const NON_GE_DEFAULT = {
  stocks: [],
  allStocks: [],
  categories: [],
  customItems: [],
  refetchStocks: () => {},
  refetchCategories: () => {},
  refetchCustomItems: () => {},
};

const NonGEContext = createContext(NON_GE_DEFAULT);

export function NonGEProvider({
  stocks,
  allStocks,
  categories,
  customItems,
  refetchStocks,
  refetchCategories,
  refetchCustomItems,
  children,
}) {
  const value = useMemo(
    () => ({
      stocks,
      allStocks,
      categories,
      customItems,
      refetchStocks,
      refetchCategories,
      refetchCustomItems,
    }),
    [stocks, allStocks, categories, customItems, refetchStocks, refetchCategories, refetchCustomItems]
  );

  return (
    <NonGEContext.Provider value={value}>
      {children}
    </NonGEContext.Provider>
  );
}

export function useNonGE() {
  return useContext(NonGEContext);
}
