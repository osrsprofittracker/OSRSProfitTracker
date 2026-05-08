import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useProfitHistoryContext } from './ProfitHistoryContext';

const UIStateContext = createContext(null);
const HighlightContext = createContext(null);

export function UIStateProvider({ userId, children }) {
  const { profitHistory } = useProfitHistoryContext();

  const [tradeMode, setTradeMode] = useState('trade');

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    const saved = localStorage.getItem('collapsedCategories');
    return saved ? JSON.parse(saved) : {};
  });

  const [milestoneProgress, setMilestoneProgress] = useState({ day: 0, week: 0, month: 0, year: 0 });

  const firedTimerNotifs = useRef(
    new Set(JSON.parse(localStorage.getItem(`osrs_fired_limit_timers_${userId}`) || '[]'))
  );

  const saveFiredTimers = useCallback(() => {
    localStorage.setItem(
      `osrs_fired_limit_timers_${userId}`,
      JSON.stringify(Array.from(firedTimerNotifs.current))
    );
  }, [userId]);

  const calculateMilestoneProgress = useCallback(() => {
    if (!profitHistory) return { day: 0, week: 0, month: 0, year: 0 };

    const getStartOfPeriod = (period) => {
      const now = new Date();
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      if (period === 'day') return date;
      if (period === 'week') {
        const dayOfWeek = (date.getUTCDay() + 6) % 7;
        date.setUTCDate(date.getUTCDate() - dayOfWeek);
        return date;
      }
      if (period === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      if (period === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      return date;
    };

    const calcPeriod = (period) => {
      const startDate = getStartOfPeriod(period);
      const total = profitHistory
        .filter(e => new Date(e.created_at) >= startDate && e.profit_type !== 'bonds')
        .reduce((sum, e) => sum + e.amount, 0);
      return Math.max(0, total);
    };

    return {
      day: calcPeriod('day'),
      week: calcPeriod('week'),
      month: calcPeriod('month'),
      year: calcPeriod('year'),
    };
  }, [profitHistory]);

  const [highlightedRows, setHighlightedRows] = useState({});

  const highlightRow = useCallback((stockId) => {
    setHighlightedRows(prev => ({ ...prev, [stockId]: true }));
    setTimeout(() => {
      setHighlightedRows(prev => ({ ...prev, [stockId]: false }));
    }, 1000);
  }, []);

  const uiValue = useMemo(() => ({
    tradeMode,
    setTradeMode,
    collapsedCategories,
    setCollapsedCategories,
    milestoneProgress,
    setMilestoneProgress,
    calculateMilestoneProgress,
    firedTimerNotifs,
    saveFiredTimers,
  }), [tradeMode, collapsedCategories, milestoneProgress, calculateMilestoneProgress, saveFiredTimers]);

  const highlightValue = useMemo(() => ({
    highlightedRows,
    highlightRow,
  }), [highlightedRows, highlightRow]);

  return (
    <UIStateContext.Provider value={uiValue}>
      <HighlightContext.Provider value={highlightValue}>
        {children}
      </HighlightContext.Provider>
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error('useUIState must be used within UIStateProvider');
  return ctx;
}

export function useHighlight() {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error('useHighlight must be used within UIStateProvider');
  return ctx;
}
