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
import { useTimeseries } from '../../../hooks/useTimeseries';
import {
  buildDailyItemProfit,
  getItemTransactions,
} from '../../../utils/itemAnalytics';
import { formatNumber } from '../../../utils/formatters';

function ChartTooltip({ active, payload, label, numberFormat, valueLabel }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      <div className="analytics-tooltip-row">
        <span>{valueLabel}</span>
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

const priceDomainFor = (series) => {
  const values = series
    .map((row) => Number(row.high))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return ['auto', 'auto'];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, Math.round((max - min) * 0.04));

  if (min === max) {
    const flatPadding = Math.max(1, Math.round(min * 0.01));
    return [min - flatPadding, max + flatPadding];
  }

  return [min - padding, max + padding];
};

export default function ItemDrilldownDrawer({
  item,
  transactions = [],
  profitHistory = [],
  timeframe,
  numberFormat,
  onClose,
}) {
  const { data: priceData, loading: priceLoading, error: priceError } = useTimeseries(
    item?.itemId,
    '1h',
    { refetchIntervalMs: null }
  );
  const itemTransactions = useMemo(
    () => getItemTransactions({ itemId: item.id, transactions, limit: 12 }),
    [item.id, transactions]
  );
  const profitSeries = useMemo(
    () => buildDailyItemProfit({
      itemId: item.id,
      transactions,
      profitHistory,
      start: timeframe?.start,
      end: timeframe?.end,
    }),
    [item.id, transactions, profitHistory, timeframe?.start, timeframe?.end]
  );
  const priceSeries = useMemo(() => (
    (priceData || [])
      .map((row) => ({
        date: new Date(Number(row.timestamp) * 1000).toISOString().slice(0, 10),
        high: Number(row.avgHighPrice),
      }))
      .filter((row) => Number.isFinite(row.high) && row.high > 0)
      .slice(-720)
  ), [priceData]);

  return (
    <>
      <div
        className="items-drawer-overlay"
        onClick={onClose}
        role="presentation"
      />
      <aside className="items-drawer" role="dialog" aria-modal="true" aria-label={`${item.name} details`}>
        <div className="items-drawer-header">
          <div>
            <h2 className="items-drawer-title">{item.name}</h2>
            <p className="items-drawer-subtitle">{item.category}</p>
          </div>
          <button
            type="button"
            className="items-drawer-close has-tooltip"
            onClick={onClose}
            aria-label="Close item details"
            data-tooltip="Close this item drilldown."
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="items-drawer-kpis">
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Current quantity still held."
          >
            <div className="analytics-kpi-mini-label">Held</div>
            <div className="analytics-kpi-mini-value">{formatNumber(item.shares, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Current cost basis for held quantity."
          >
            <div className="analytics-kpi-mini-label">Cost</div>
            <div className="analytics-kpi-mini-value">{formatNumber(item.totalCost, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="Estimated profit if current holdings sold now at live GE high after tax. Not affected by the selected timeframe."
          >
            <div className="analytics-kpi-mini-label">Unrealized profit</div>
            <div className="analytics-kpi-mini-value">{formatNumber(item.unrealizedProfit, numberFormat)}</div>
          </div>
          <div
            className="analytics-kpi-mini has-tooltip"
            data-tooltip="All-time realized profit divided by all-time sold cost basis."
          >
            <div className="analytics-kpi-mini-label">Margin</div>
            <div className="analytics-kpi-mini-value">{Number(item.marginPct || 0).toFixed(1)}%</div>
          </div>
        </div>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Linked stock-profit rows for this item in the selected Analytics timeframe, with zero-profit days included."
          >
            Realized profit per day
          </h3>
          {profitSeries.length === 0 ? (
            <div className="analytics-widget-empty">No linked profit rows for this item.</div>
          ) : (
            <div className="items-chart is-drawer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitSeries}>
                  <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={10} />
                  <YAxis
                    domain={profitDomainFor(profitSeries)}
                    stroke="rgb(148, 163, 184)"
                    fontSize={10}
                    tickFormatter={(value) => formatNumber(value, numberFormat)}
                  />
                  <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
                  <Tooltip
                    content={(
                      <ChartTooltip
                        numberFormat={numberFormat}
                        valueLabel="Profit"
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Grand Exchange high-price overlay from the RuneScape Wiki API for linked items."
          >
            GE price overlay
          </h3>
          {!item.itemId && <div className="analytics-widget-empty">No GE item id linked.</div>}
          {item.itemId && priceLoading && <div className="analytics-widget-empty">Loading GE prices...</div>}
          {item.itemId && priceError && <div className="analytics-widget-empty">GE prices unavailable.</div>}
          {item.itemId && !priceLoading && !priceError && priceSeries.length > 0 && (
            <div className="items-chart is-drawer">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceSeries}>
                  <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={10} />
                  <YAxis
                    domain={priceDomainFor(priceSeries)}
                    allowDataOverflow
                    stroke="rgb(148, 163, 184)"
                    fontSize={10}
                    tickFormatter={(value) => formatNumber(value, numberFormat)}
                  />
                  <Tooltip
                    content={(
                      <ChartTooltip
                        numberFormat={numberFormat}
                        valueLabel="High price"
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="high" stroke="rgb(96, 165, 250)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="items-drawer-section">
          <h3
            className="items-drawer-section-title has-tooltip"
            data-tooltip="Most recent buy and sell transactions for this item."
          >
            Recent transactions
          </h3>
          <table className="analytics-bw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {itemTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{String(transaction.date).slice(0, 10)}</td>
                  <td><span className="items-badge">{transaction.type}</span></td>
                  <td>{formatNumber(transaction.shares, numberFormat)}</td>
                  <td>{formatNumber(transaction.total, numberFormat)}</td>
                </tr>
              ))}
              {itemTransactions.length === 0 && (
                <tr>
                  <td className="items-table-empty" colSpan={4}>
                    No transactions recorded for this item.
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
