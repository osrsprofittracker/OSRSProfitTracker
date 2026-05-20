import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useAnalyticsTimeframe } from '../hooks/useAnalyticsTimeframe';
import { useAnalytics } from '../hooks/useAnalytics';
import TimeframeSelector from '../components/analytics/TimeframeSelector';
import KpiBand from '../components/analytics/KpiBand';
import ProfitOverTimeChart from '../components/analytics/widgets/ProfitOverTimeChart';
import GpTradedChart from '../components/analytics/widgets/GpTradedChart';
import ProfitHeatmap from '../components/analytics/widgets/ProfitHeatmap';
import BuyingVsSellingChart from '../components/analytics/widgets/BuyingVsSellingChart';
import ItemIcon from '../components/ItemIcon';
import { addDays, inclusiveDayCount, subtractDays, sumProfit } from '../utils/analyticsHelpers';
import { formatNumber } from '../utils/formatters';
import { getNonGECatalogItem, getNonGEItemImageUrl } from '../utils/nonGeCatalog';
import {
  computeNonGEBuyingVsSelling,
  computeNonGECategoryRows,
  computeNonGEInventoryValue,
  computeNonGEItems,
  computeNonGETotalProfit,
  firstNonGEActivityDate,
  normalizeNonGEProfitHistory,
  normalizeNonGEStocks,
  normalizeNonGETransactions,
} from '../utils/nonGeAnalytics';
import '../styles/analytics-page.css';
import '../styles/analytics-widgets.css';
import '../styles/analytics-items.css';

const DEFAULT_ALL_TIME_START = '2020-01-01';
const CATEGORY_PREVIEW_LIMIT = 8;

const sumGpTraded = (buckets) => buckets.reduce((sum, bucket) => sum + (bucket.gp_traded || 0), 0);

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

function MarketSwitch({ activeMarket, navigateToPage }) {
  return (
    <div className="analytics-market-switch" aria-label="Analytics market">
      <button
        type="button"
        className={`analytics-market-btn${activeMarket === 'ge' ? ' is-active' : ''}`}
        onClick={() => navigateToPage?.('analytics')}
      >
        GE Analytics
      </button>
      <button
        type="button"
        className={`analytics-market-btn${activeMarket === 'non_ge' ? ' is-active' : ''}`}
        onClick={() => navigateToPage?.('analyticsNonGE')}
      >
        Non-GE Analytics
      </button>
    </div>
  );
}

function NonGEItemTable({ items = [], numberFormat }) {
  const visibleItems = useMemo(() => (
    [...items]
      .filter((item) => (
        item.totalProfit !== 0
        || item.windowGpTraded !== 0
        || item.totalCost !== 0
        || item.totalCostSold !== 0
      ))
      .sort((a, b) => Math.abs(b.totalProfit) - Math.abs(a.totalProfit))
      .slice(0, 25)
  ), [items]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Non-GE items ranked by absolute all-time realized profit. Archived items are included for historical accuracy."
          >
            Non-GE item performance
          </h3>
          <p className="analytics-widget-subtitle">Top 25 by realized profit impact</p>
        </div>
      </div>
      <div className="items-table-wrap">
        <table className="items-table non-ge-analytics-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Held</th>
              <th>Cost</th>
              <th>Total profit</th>
              <th>Margin</th>
              <th>Period sells</th>
              <th>Period GP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td className="items-name-cell">
                  <span className="items-name-content">
                    <ItemIcon
                      src={getNonGEItemImageUrl(getNonGECatalogItem(item.catalogItemKey))}
                      alt=""
                      className="items-table-item-icon"
                      fallbackText={item.name}
                    />
                    <span>{item.name}</span>
                  </span>
                </td>
                <td>{item.category}</td>
                <td>{formatNumber(item.shares, numberFormat)}</td>
                <td>{formatNumber(item.totalCost, numberFormat)}</td>
                <td className={item.totalProfit < 0 ? 'analytics-profit-negative' : 'analytics-profit-positive'}>
                  {formatNumber(item.totalProfit, numberFormat)}
                </td>
                <td>{(Number(item.marginPct) || 0).toFixed(1)}%</td>
                <td>{formatNumber(item.windowSells, numberFormat)}</td>
                <td>{formatNumber(item.windowGpTraded, numberFormat)}</td>
                <td>{item.archived ? <span className="non-ge-analytics-badge">Archived</span> : 'Active'}</td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td className="items-table-empty" colSpan={9}>
                  No Non-GE item activity for this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NonGECategoryTable({ rows = [], numberFormat, timeframeLabel }) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? rows : rows.slice(0, CATEGORY_PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, rows.length - visibleRows.length);
  const canToggle = rows.length > CATEGORY_PREVIEW_LIMIT;

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Non-GE categories from all active and archived Non-GE stock rows."
          >
            Non-GE category breakdown
          </h3>
          <p className="analytics-widget-subtitle">{timeframeLabel} activity with all-time inventory context</p>
        </div>
        {canToggle && (
          <button
            type="button"
            className="analytics-toggle has-tooltip"
            onClick={() => setShowAll((value) => !value)}
            data-tooltip="Show or hide lower-ranked Non-GE categories."
          >
            {showAll ? 'Show less' : `Show all (${rows.length})`}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="analytics-widget-empty">No Non-GE categories have analytics data yet.</div>
      ) : (
        <div className="non-ge-category-grid">
          {visibleRows.map((row) => (
            <article className="non-ge-category-card" key={row.category}>
              <div className="non-ge-category-card-header">
                <h4>{row.category}</h4>
                <span>{formatNumber(row.items, numberFormat)} items</span>
              </div>
              <div className="non-ge-category-metrics">
                <div>
                  <span>Inventory</span>
                  <strong>{formatNumber(row.inventoryValue, numberFormat)}</strong>
                </div>
                <div>
                  <span>Total profit</span>
                  <strong className={row.totalProfit < 0 ? 'analytics-profit-negative' : 'analytics-profit-positive'}>
                    {formatNumber(row.totalProfit, numberFormat)}
                  </strong>
                </div>
                <div>
                  <span>Period profit</span>
                  <strong className={row.windowProfit < 0 ? 'analytics-profit-negative' : 'analytics-profit-positive'}>
                    {formatNumber(row.windowProfit, numberFormat)}
                  </strong>
                </div>
                <div>
                  <span>Period GP</span>
                  <strong>{formatNumber(row.gpTradedWindow, numberFormat)}</strong>
                </div>
                <div>
                  <span>Trades</span>
                  <strong>{formatNumber(row.tradesWindow, numberFormat)}</strong>
                </div>
                <div>
                  <span>Margin</span>
                  <strong>{(Number(row.avgMarginPct) || 0).toFixed(1)}%</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {hiddenCount > 0 && (
        <div className="non-ge-category-footer">
          Showing {visibleRows.length} of {rows.length} categories. {hiddenCount} more hidden.
        </div>
      )}
    </div>
  );
}

export default function NonGEAnalyticsPage({
  userId,
  stocks,
  categories,
  transactions,
  profitHistory,
  numberFormat,
  navigateToPage,
  transactionHistoryScope,
  profitHistoryScope,
  loadFullTransactions,
  loadFullProfitHistory,
  fullTransactionsLoading = false,
  fullProfitHistoryLoading = false,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const nonGEStocks = useMemo(
    () => normalizeNonGEStocks(stocks || [], categories || []),
    [stocks, categories]
  );
  const nonGETransactions = useMemo(
    () => normalizeNonGETransactions(transactions || []),
    [transactions]
  );
  const nonGEProfitHistory = useMemo(
    () => normalizeNonGEProfitHistory(profitHistory || [], nonGETransactions),
    [profitHistory, nonGETransactions]
  );
  const localAllTimeStart = useMemo(
    () => firstNonGEActivityDate(nonGETransactions, nonGEProfitHistory),
    [nonGETransactions, nonGEProfitHistory]
  );
  const hasFullLocalHistory = transactionHistoryScope?.full && profitHistoryScope?.full;
  const allTimeStart = hasFullLocalHistory ? localAllTimeStart : DEFAULT_ALL_TIME_START;
  const timeframe = useAnalyticsTimeframe(userId, allTimeStart);

  useEffect(() => {
    if (!transactionHistoryScope?.full && !fullTransactionsLoading) {
      loadFullTransactions?.();
    }

    if (!profitHistoryScope?.full && !fullProfitHistoryLoading) {
      loadFullProfitHistory?.();
    }
  }, [
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
    transactions: nonGETransactions,
    stocks: nonGEStocks,
    profitHistory: nonGEProfitHistory,
  }), [nonGETransactions, nonGEStocks, nonGEProfitHistory]);

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
  const totalProfit = useMemo(() => computeNonGETotalProfit(nonGEStocks), [nonGEStocks]);
  const periodProfit = useMemo(() => (
    timeframe.window === 'All' ? totalProfit : sumProfit(current.buckets)
  ), [timeframe.window, totalProfit, current.buckets]);
  const inventoryValue = useMemo(() => computeNonGEInventoryValue(nonGEStocks), [nonGEStocks]);
  const items = useMemo(() => (
    computeNonGEItems({
      stocks: nonGEStocks,
      transactions: nonGETransactions,
      start: timeframe.start,
      end: timeframe.end,
    })
  ), [nonGEStocks, nonGETransactions, timeframe.start, timeframe.end]);
  const buyingVsSelling = useMemo(() => computeNonGEBuyingVsSelling(items), [items]);
  const categoryRows = useMemo(() => (
    computeNonGECategoryRows({
      items,
      buckets: current.buckets,
    })
  ), [items, current.buckets]);
  const last365Buckets = useMemo(() => {
    const start = subtractDays(timeframe.end, 364);
    return allTime.buckets.filter((bucket) => (
      bucket.bucket_date >= start && bucket.bucket_date <= timeframe.end
    ));
  }, [allTime.buckets, timeframe.end]);

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
            Non-GE realized profit, volume, item, and category analytics.
          </p>
          <MarketSwitch activeMarket="non_ge" navigateToPage={navigateToPage} />
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

      {(fullTransactionsLoading || fullProfitHistoryLoading) && (
        <div className="analytics-fallback-banner">
          Loading older Non-GE history for detailed analytics.
        </div>
      )}

      <KpiBand
        loading={current.loading || allTime.loading}
        totalProfit={totalProfit}
        periodProfit={periodProfit}
        priorPeriodProfit={timeframe.window !== 'All' ? sumProfit(prior.buckets) : null}
        gpTraded={sumGpTraded(current.buckets)}
        priorGpTraded={timeframe.window !== 'All' ? sumGpTraded(prior.buckets) : null}
        inventoryValue={inventoryValue}
        numberFormat={numberFormat}
        tooltips={{
          totalProfit: 'All-time realized profit from Non-GE stock totals, including archived rows.',
          periodProfit: 'Realized Non-GE stock profit inside the selected timeframe.',
          gpTraded: 'Total GP value of Non-GE buy and sell transactions in the selected timeframe.',
          inventoryValue: 'Current cost basis still tied up in held Non-GE stock.',
        }}
      />

      <div className="analytics-tab-content">
        <div className="analytics-stack">
          <div className="analytics-grid-2">
            <ProfitOverTimeChart
              buckets={allTime.buckets}
              numberFormat={numberFormat}
              title="All-time profit history"
              tooltip="All loaded Non-GE realized stock profit by day. The page loads full transaction and profit history so older rows are included."
              emptyMessage="No Non-GE profit history available yet."
            />
            <GpTradedChart buckets={current.buckets} numberFormat={numberFormat} />
          </div>
          <NonGECategoryTable
            rows={categoryRows}
            numberFormat={numberFormat}
            timeframeLabel={timeframe.window}
          />
          <ProfitHeatmap
            allBuckets={last365Buckets}
            endDate={timeframe.end}
            numberFormat={numberFormat}
            onCellClick={(date) => navigateToPage?.('history', {
              query: { dateFrom: date, dateTo: date, market: 'non_ge' },
            })}
          />
          <NonGEItemTable items={items} numberFormat={numberFormat} />
          <BuyingVsSellingChart rows={buyingVsSelling} numberFormat={numberFormat} />
        </div>
      </div>
    </div>
  );
}
