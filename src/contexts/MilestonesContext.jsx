import { createContext, useContext } from 'react';
import { useMilestones } from '../hooks/useMilestones';

const MilestonesContext = createContext(null);

export function MilestonesProvider({ userId, children }) {
  const value = useMilestones(userId);
  return <MilestonesContext.Provider value={value}>{children}</MilestonesContext.Provider>;
}

export function useMilestonesContext() {
  const ctx = useContext(MilestonesContext);
  if (!ctx) throw new Error('useMilestonesContext must be used within MilestonesProvider');
  return ctx;
}
