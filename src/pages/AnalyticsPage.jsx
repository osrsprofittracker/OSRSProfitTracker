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
import { addDays, daysBetween, subtractDays, sumProfit } from '../utils/analyticsHelpers';
import '../styles/analytics-page.css';
import '../styles/analytics-widgets.css';

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
  const hasPriorPeriod = timeframe.window !== 'All';

  const inventoryValue = useMemo(
    () => safeStocksForStats.reduce((sum, stock) => sum + (stock.totalCost || 0), 0),
    [safeStocksForStats]
  );

  const handleTabChange = (next) => {
    setActiveTab(next);

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
        priorPeriodProfit={hasPriorPeriod ? sumProfit(prior.buckets) : null}
        gpTraded={sumGpTraded(current.buckets)}
        priorGpTraded={hasPriorPeriod ? sumGpTraded(prior.buckets) : null}
        inventoryValue={inventoryValue}
        numberFormat={numberFormat}
      />

      <TabNav activeTab={activeTab} onChange={handleTabChange} />

      <div className="analytics-tab-content">
        {activeTab === 'profit' && (
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
            totalProfitValue={derivedTotalProfit}
            fallbackData={fallbackData}
          />
        )}
        {activeTab === 'items' && (
          <ItemsTab
            stocks={safeStocksForStats}
            transactions={safeTransactions}
            profitHistory={safeProfitHistory}
            timeframe={timeframe}
            numberFormat={numberFormat}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab buckets={current.buckets} timeframe={timeframe} numberFormat={numberFormat} />
        )}
        {activeTab === 'goals' && (
          <GoalsTab buckets={current.buckets} timeframe={timeframe} numberFormat={numberFormat} />
        )}
      </div>
    </div>
  );
}
