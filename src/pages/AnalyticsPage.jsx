import React, { useMemo, useState } from 'react';
import { useAnalyticsTimeframe } from '../hooks/useAnalyticsTimeframe';
import { useAnalytics } from '../hooks/useAnalytics';
import TimeframeSelector from '../components/analytics/TimeframeSelector';
import TabNav, { ANALYTICS_TABS } from '../components/analytics/TabNav';
import KpiBand from '../components/analytics/KpiBand';
import ProfitTab from '../components/analytics/ProfitTab';
import ItemsTab from '../components/analytics/ItemsTab';
import CategoriesTab from '../components/analytics/CategoriesTab';
import GoalsTab from '../components/analytics/GoalsTab';
import { useTrade } from '../contexts/TradeContext';
import '../styles/analytics-page.css';
import '../styles/analytics-widgets.css';

const subtractDays = (iso, days) => {
  const date = new Date(iso);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const addDays = (iso, days) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const sumProfit = (buckets) => buckets.reduce(
  (sum, bucket) => sum
    + (bucket.profit_items || 0)
    + (bucket.profit_dump || 0)
    + (bucket.profit_referral || 0)
    + (bucket.profit_bonds || 0),
  0
);

const sumGpTraded = (buckets) => buckets.reduce((sum, bucket) => sum + (bucket.gp_traded || 0), 0);

export default function AnalyticsPage({
  userId,
  transactions,
  profitHistory,
  profits,
  numberFormat,
  initialTab,
  navigateToPage,
}) {
  const { allStocks, stocks } = useTrade();
  const stocksForStats = allStocks?.length > 0 ? allStocks : stocks;
  const safeTransactions = transactions || [];
  const safeProfitHistory = profitHistory || [];
  const safeStocksForStats = stocksForStats || [];

  const [activeTab, setActiveTab] = useState(() => (
    ANALYTICS_TABS.includes(initialTab) ? initialTab : 'profit'
  ));
  const [mountedTabs, setMountedTabs] = useState(() => new Set([activeTab]));

  const allTimeStart = useMemo(() => {
    const dates = [
      ...safeTransactions.map((transaction) => String(transaction.date || '').slice(0, 10)),
      ...safeProfitHistory.map((profit) => String(profit.created_at || '').slice(0, 10)),
    ].filter(Boolean);

    return dates.length > 0 ? dates.sort()[0] : null;
  }, [safeTransactions, safeProfitHistory]);

  const timeframe = useAnalyticsTimeframe(userId, allTimeStart);
  const priorStart = useMemo(
    () => subtractDays(timeframe.start, daysBetween(timeframe.start, timeframe.end)),
    [timeframe.start, timeframe.end]
  );
  const priorEnd = useMemo(() => addDays(timeframe.start, -1), [timeframe.start]);

  const fallbackData = useMemo(() => ({
    transactions: safeTransactions,
    stocks: safeStocksForStats,
    profitHistory: safeProfitHistory,
  }), [safeTransactions, safeStocksForStats, safeProfitHistory]);

  const current = useAnalytics({
    userId,
    start: timeframe.start,
    end: timeframe.end,
    bucket: timeframe.bucket,
    fallbackData,
  });
  const prior = useAnalytics({
    userId,
    start: priorStart,
    end: priorEnd,
    bucket: timeframe.bucket,
    fallbackData,
  });
  const allTime = useAnalytics({
    userId,
    start: allTimeStart || '2020-01-01',
    end: timeframe.end,
    bucket: 'day',
    fallbackData,
  });

  const derivedTotalProfit = useMemo(() => {
    const stocksProfit = safeStocksForStats.reduce(
      (sum, stock) => sum + (stock.totalCostSold - (stock.totalCostBasisSold || 0)),
      0
    );
    const otherProfit = (profits?.dumpProfit || 0)
      + (profits?.referralProfit || 0)
      + (profits?.bondsProfit || 0);

    return stocksProfit + otherProfit;
  }, [safeStocksForStats, profits]);
  const periodProfit = useMemo(() => (
    timeframe.window === 'All' ? derivedTotalProfit : sumProfit(current.buckets)
  ), [timeframe.window, derivedTotalProfit, current.buckets]);

  const inventoryValue = useMemo(
    () => safeStocksForStats.reduce((sum, stock) => sum + (stock.totalCost || 0), 0),
    [safeStocksForStats]
  );

  const handleTabChange = (next) => {
    setActiveTab(next);
    setMountedTabs((previous) => new Set(previous).add(next));

    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">Analytics</h1>
          <p className="analytics-page-subtitle">
            Deep portfolio insights across profit, items, categories, and goals.
          </p>
        </div>
        <TimeframeSelector
          window={timeframe.window}
          options={timeframe.options}
          onChange={timeframe.setWindow}
        />
      </div>

      {current.fromFallback && (
        <div className="analytics-fallback-banner">
          Showing locally-computed data. Live aggregation is temporarily unavailable.
        </div>
      )}

      <KpiBand
        loading={current.loading || allTime.loading}
        totalProfit={derivedTotalProfit}
        periodProfit={periodProfit}
        priorPeriodProfit={sumProfit(prior.buckets)}
        gpTraded={sumGpTraded(current.buckets)}
        priorGpTraded={sumGpTraded(prior.buckets)}
        inventoryValue={inventoryValue}
        numberFormat={numberFormat}
      />

      <TabNav activeTab={activeTab} onChange={handleTabChange} />

      <div className="analytics-tab-content">
        {mountedTabs.has('profit') && (
          <div hidden={activeTab !== 'profit'}>
            <ProfitTab
              userId={userId}
              buckets={current.buckets}
              priorBuckets={prior.buckets}
              timeframe={timeframe}
              transactions={safeTransactions}
              stocks={safeStocksForStats}
              profitHistory={safeProfitHistory}
              numberFormat={numberFormat}
              onNavigateToHistory={(dateFrom, dateTo = dateFrom) => navigateToPage?.('history', {
                query: { dateFrom, dateTo },
              })}
              allTimeBuckets={allTime.buckets}
              fallbackData={fallbackData}
            />
          </div>
        )}
        {mountedTabs.has('items') && (
          <div hidden={activeTab !== 'items'}>
            <ItemsTab buckets={current.buckets} timeframe={timeframe} numberFormat={numberFormat} />
          </div>
        )}
        {mountedTabs.has('categories') && (
          <div hidden={activeTab !== 'categories'}>
            <CategoriesTab buckets={current.buckets} timeframe={timeframe} numberFormat={numberFormat} />
          </div>
        )}
        {mountedTabs.has('goals') && (
          <div hidden={activeTab !== 'goals'}>
            <GoalsTab buckets={current.buckets} timeframe={timeframe} numberFormat={numberFormat} />
          </div>
        )}
      </div>
    </div>
  );
}

function daysBetween(startIso, endIso) {
  const ms = new Date(endIso) - new Date(startIso);
  return Math.max(1, Math.round(ms / 86400000));
}
