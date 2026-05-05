import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildCategoryDrilldownData } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

function ChartTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      <div className="analytics-tooltip-row">
        <span>Profit</span>
        <span className="analytics-tooltip-value">
          {formatNumber(payload[0].value, numberFormat)}
        </span>
      </div>
    </div>
  );
}

const profitDomainFor = (series) => {
  const values = series.map((row) => Number(row.profit) || 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);

  if (min < 0 && max > 0) return [min, max];
  if (min < 0) return [min, 0];
  return [0, max || 1];
};

const formatTurnover = (value) => {
  if (value == null) return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  return `${numericValue.toFixed(1)}%`;
};

const formatDate = (value) => (value ? String(value).slice(0, 10) : '-');

export default function CategoryDrilldownDrawer({
  category,
  breakdownRows = [],
  buckets = [],
  stocks = [],
  transactions = [],
  profitHistory = [],
  timeframe,
  timeframeOptions = [],
  numberFormat,
  onClose,
  onTimeframeChange,
}) {
  const data = useMemo(
    () => buildCategoryDrilldownData({
      category,
      breakdownRows,
      buckets,
      stocks,
      transactions,
      profitHistory,
      start: timeframe?.start,
      end: timeframe?.end,
    }),
    [
      category,
      breakdownRows,
      buckets,
      stocks,
      transactions,
      profitHistory,
      timeframe?.start,
      timeframe?.end,
    ]
  );
  const { metrics } = data;
  const timeframeLabel = timeframe?.window || 'selected';
  const sortedTopItems = useMemo(() => (
    [...data.topItems]
      .sort((a, b) => {
        const profitComparison = (Number(b.windowProfit) || 0) - (Number(a.windowProfit) || 0);
        if (profitComparison !== 0) return profitComparison;
        return (Number(b.windowGpTraded) || 0) - (Number(a.windowGpTraded) || 0);
      })
      .slice(0, 12)
  ), [data.topItems]);

  return (
    <>
      <div
        className="items-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className="items-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${category} category details`}
      >
        <div className="items-drawer-header">
          <div>
            <h2 className="items-drawer-title">{category}</h2>
            <p className="items-drawer-subtitle">
              {`Category analytics for ${timeframeLabel}`}
            </p>
          </div>
          <button
            type="button"
            className="items-drawer-close"
            onClick={onClose}
            aria-label="Close category details"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {timeframeOptions.length > 0 && onTimeframeChange && (
          <div className="category-drawer-timeframe" aria-label="Category drilldown timeframe">
            {timeframeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`category-drawer-timeframe-btn${timeframe?.window === option ? ' is-active' : ''}`}
                aria-label={`Set Analytics timeframe to ${option === 'All' ? 'all available history' : option}`}
                aria-pressed={timeframe?.window === option}
                onClick={() => onTimeframeChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="items-drawer-kpis category-drawer-kpis">
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Realized profit for this category in the selected Analytics timeframe."
          >
            <div className="analytics-kpi-mini-label">Profit</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.windowProfit, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Buy and sell transaction count for this category in the selected Analytics timeframe."
          >
            <div className="analytics-kpi-mini-label">Trades</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.tradesWindow, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Average inventory cost held by this category across the selected Analytics timeframe."
          >
            <div className="analytics-kpi-mini-label">Avg inventory</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.avgInventoryWindow, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Selected-window realized profit divided by average inventory cost."
          >
            <div className="analytics-kpi-mini-label">Turnover</div>
            <div className="analytics-kpi-mini-value">{formatTurnover(metrics.turnoverPct)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Current cost basis still held in this category. Not affected by the selected timeframe."
          >
            <div className="analytics-kpi-mini-label">Current inventory</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.inventoryValue, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Estimated profit if current holdings in this category sold now at live GE high after tax. Not affected by the selected timeframe."
          >
            <div className="analytics-kpi-mini-label">Unrealized</div>
            <div className="analytics-kpi-mini-value">{formatNumber(metrics.unrealizedProfit, numberFormat)}</div>
          </div>
        </div>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Daily realized profit for this category in the selected Analytics timeframe."
          >
            Profit trend
          </h3>
          {data.profitSeries.length === 0 ? (
            <div className="analytics-widget-empty">No linked profit rows for this category.</div>
          ) : (
            <div className="items-chart is-drawer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.profitSeries}>
                  <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={10} />
                  <YAxis
                    domain={profitDomainFor(data.profitSeries)}
                    stroke="rgb(148, 163, 184)"
                    fontSize={10}
                    tickFormatter={(value) => formatNumber(value, numberFormat)}
                  />
                  <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
                  <Tooltip content={<ChartTooltip numberFormat={numberFormat} />} />
                  <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Items in this category ranked by selected-window profit. GP traded uses the same Analytics timeframe."
          >
            Top items
          </h3>
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Held</th>
                <th>Window GP</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {sortedTopItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{formatNumber(item.shares, numberFormat)}</td>
                  <td>{formatNumber(item.windowGpTraded, numberFormat)}</td>
                  <td className={(Number(item.windowProfit) || 0) < 0 ? 'items-profit-negative' : 'items-profit-positive'}>
                    {formatNumber(item.windowProfit, numberFormat)}
                  </td>
                </tr>
              ))}
              {sortedTopItems.length === 0 && (
                <tr>
                  <td className="items-table-empty" colSpan={4}>
                    No items in this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Most recent buy and sell transactions for items in this category."
          >
            Recent transactions
          </h3>
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.itemName}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td><span className="items-badge">{transaction.type}</span></td>
                  <td>{formatNumber(transaction.shares, numberFormat)}</td>
                  <td>{formatNumber(transaction.total, numberFormat)}</td>
                </tr>
              ))}
              {data.recentTransactions.length === 0 && (
                <tr>
                  <td className="items-table-empty" colSpan={5}>
                    No transactions recorded for this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </aside>
    </>
  );
}
