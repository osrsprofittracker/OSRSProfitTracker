import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useAnalyticsTimeframe } from '../hooks/useAnalyticsTimeframe';
import { useAnalytics } from '../hooks/useAnalytics';
import { useUrlState } from '../hooks/useUrlState';
import TimeframeSelector from '../components/analytics/TimeframeSelector';
import TabNav, { ANALYTICS_TABS } from '../components/analytics/TabNav';
import KpiBand from '../components/analytics/KpiBand';
import ProfitTab from '../components/analytics/ProfitTab';
import ItemsTab from '../components/analytics/ItemsTab';
import CategoriesTab from '../components/analytics/CategoriesTab';
import GoalsTab from '../components/analytics/GoalsTab';
import { useTrade } from '../contexts/TradeContext';
import { addDays, inclusiveDayCount, subtractDays, sumProfit } from '../utils/analyticsHelpers';
import '../styles/analytics-page.css';
import '../styles/analytics-widgets.css';

const sumGpTraded = (buckets) => buckets.reduce((sum, bucket) => sum + (bucket.gp_traded || 0), 0);
const DEFAULT_ALL_TIME_START = '2020-01-01';
const isGEMarketRow = (row) => (row?.market || 'ge') === 'ge';

const parseTabParam = (value) => (
  ANALYTICS_TABS.includes(value) ? value : null
);

const serializeTabParam = (value) => (
  ANALYTICS_TABS.includes(value) ? value : null
);

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.className = 'analytics-copy-fallback';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
};

export default function AnalyticsPage({
  userId,
  transactions,
  profitHistory,
  profits,
  numberFormat,
  initialTab,
  navigateToPage,
  milestones,
  milestoneHistory,
  milestoneProgress,
  transactionHistoryScope,
  profitHistoryScope,
  loadFullTransactions,
  loadFullProfitHistory,
  fullTransactionsLoading = false,
  fullProfitHistoryLoading = false,
}) {
  const { allStocks, stocks } = useTrade();
  const stocksForStats = allStocks?.length > 0 ? allStocks : stocks;
  const safeTransactions = transactions || [];
  const safeProfitHistory = profitHistory || [];
  const safeStocksForStats = stocksForStats || [];
  const geTransactions = useMemo(
    () => safeTransactions.filter(isGEMarketRow),
    [safeTransactions]
  );
  const geProfitHistory = useMemo(
    () => safeProfitHistory.filter(isGEMarketRow),
    [safeProfitHistory]
  );

  const [activeTab, setActiveTab] = useUrlState(
    'tab',
    ANALYTICS_TABS.includes(initialTab) ? initialTab : 'profit',
    parseTabParam,
    serializeTabParam,
    { history: 'push' }
  );
  const [linkCopied, setLinkCopied] = useState(false);

  const scopeCoversStart = (scope, start) => {
    if (scope?.full) return true;
    if (!scope?.since || !start) return false;
    return start >= String(scope.since).slice(0, 10);
  };

  const localAllTimeStart = useMemo(() => {
    const dates = [
      ...geTransactions.map((transaction) => String(transaction.date || '').slice(0, 10)),
      ...geProfitHistory.map((profit) => String(profit.created_at || '').slice(0, 10)),
    ].filter(Boolean);

    return dates.length > 0 ? dates.sort()[0] : null;
  }, [geTransactions, geProfitHistory]);

  const hasFullLocalHistory = transactionHistoryScope?.full && profitHistoryScope?.full;
  const allTimeStart = hasFullLocalHistory ? localAllTimeStart : DEFAULT_ALL_TIME_START;
  const timeframe = useAnalyticsTimeframe(userId, allTimeStart);
  const transactionScopeCoversTimeframe = scopeCoversStart(transactionHistoryScope, timeframe.start);
  const profitScopeCoversTimeframe = scopeCoversStart(profitHistoryScope, timeframe.start);

  useEffect(() => {
    if (timeframe.window === 'All' || !transactionScopeCoversTimeframe) {
      if (!transactionHistoryScope?.full && !fullTransactionsLoading) {
        loadFullTransactions?.();
      }
    }

    if (timeframe.window === 'All' || !profitScopeCoversTimeframe) {
      if (!profitHistoryScope?.full && !fullProfitHistoryLoading) {
        loadFullProfitHistory?.();
      }
    }
  }, [
    timeframe.window,
    transactionScopeCoversTimeframe,
    profitScopeCoversTimeframe,
    transactionHistoryScope?.full,
    profitHistoryScope?.full,
    fullTransactionsLoading,
    fullProfitHistoryLoading,
    loadFullTransactions,
    loadFullProfitHistory
  ]);

  const priorStart = useMemo(
    () => subtractDays(timeframe.start, inclusiveDayCount(timeframe.start, timeframe.end)),
    [timeframe.start, timeframe.end]
  );
  const priorEnd = useMemo(() => addDays(timeframe.start, -1), [timeframe.start]);

  const fallbackData = useMemo(() => ({
    transactions: geTransactions,
    stocks: safeStocksForStats,
    profitHistory: geProfitHistory,
  }), [geTransactions, safeStocksForStats, geProfitHistory]);

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
    start: allTimeStart || DEFAULT_ALL_TIME_START,
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

  const handleTabChange = useCallback((next) => {
    setActiveTab(next, { history: 'push' });
  }, [setActiveTab]);

  const handleCopyLink = useCallback(async () => {
    const copied = await copyText(window.location.href).catch(() => false);
    setLinkCopied(copied);
    window.setTimeout(() => setLinkCopied(false), 1600);
  }, []);

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">Analytics</h1>
          <p className="analytics-page-subtitle">
            Deep GE-market insights across profit, items, categories, and goals.
          </p>
        </div>
        <div className="analytics-header-actions">
          <TimeframeSelector
            window={timeframe.window}
            options={timeframe.options}
            onChange={timeframe.setWindow}
          />
          <button
            type="button"
            className={`analytics-copy-link-btn has-tooltip${linkCopied ? ' is-copied' : ''}`}
            data-tooltip={linkCopied ? 'Link copied.' : 'Copy link to this analytics view.'}
            aria-label="Copy link to this analytics view"
            onClick={handleCopyLink}
          >
            {linkCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {linkCopied && <span className="analytics-copy-toast">Copied</span>}
        </div>
      </div>

      {current.fromFallback && (
        <div className="analytics-fallback-banner">
          Showing locally-computed data. Live aggregation is temporarily unavailable.
        </div>
      )}

      {(fullTransactionsLoading || fullProfitHistoryLoading) && (
        <div className="analytics-fallback-banner">
          Loading older history for detailed analytics.
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
            transactions={geTransactions}
            stocks={safeStocksForStats}
            profitHistory={geProfitHistory}
            numberFormat={numberFormat}
            onNavigateToHistory={(dateFrom, dateTo = dateFrom, extraFilters = {}) => navigateToPage?.('history', {
              query: { dateFrom, dateTo, ...extraFilters, market: 'ge' },
            })}
            allTimeBuckets={allTime.buckets}
            totalProfitValue={derivedTotalProfit}
            fallbackData={fallbackData}
          />
        )}
        {activeTab === 'items' && (
          <ItemsTab
            stocks={safeStocksForStats}
            transactions={geTransactions}
            profitHistory={geProfitHistory}
            timeframe={timeframe}
            timeframeOptions={timeframe.options}
            numberFormat={numberFormat}
            onTimeframeChange={timeframe.setWindow}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab
            buckets={current.buckets}
            priorBuckets={prior.buckets}
            stocks={safeStocksForStats}
            transactions={geTransactions}
            profitHistory={geProfitHistory}
            timeframe={timeframe}
            timeframeOptions={timeframe.options}
            numberFormat={numberFormat}
            onTimeframeChange={timeframe.setWindow}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsTab
            milestones={milestones}
            milestoneHistory={milestoneHistory}
            milestoneProgress={milestoneProgress}
            numberFormat={numberFormat}
            firstActivityDate={localAllTimeStart}
          />
        )}
      </div>
    </div>
  );
}
