import { createContext, useContext, useMemo } from 'react';
import { useGEPrices } from '../hooks/useGEPrices';

const GE_DATA_DEFAULT = { gePrices: {}, geMapping: [], geIconMap: {}, membershipMap: {}, mappingLoading: true };
const GEDataContext = createContext(GE_DATA_DEFAULT);

export function GEDataProvider({ children }) {
  const { prices: gePrices, mapping: geMapping, iconMap: geIconMap, mappingLoading } = useGEPrices();

  const membershipMap = useMemo(
    () => Object.fromEntries((geMapping || []).map(item => [item.id, !!item.members])),
    [geMapping]
  );

  const value = useMemo(
    () => ({ gePrices, geMapping, geIconMap, membershipMap, mappingLoading }),
    [gePrices, geMapping, geIconMap, membershipMap, mappingLoading]
  );

  return (
    <GEDataContext.Provider value={value}>
      {children}
    </GEDataContext.Provider>
  );
}

export function useGEData() {
  return useContext(GEDataContext);
}
