import React, { useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  computeCategoryShareSnapshot,
  getCategoryColor,
  getCategoryColorIndex,
} from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const METRICS = [
  {
    key: 'totalCost',
    label: 'Inventory',
    tooltip: 'Current cost basis still tied up in held stock.',
  },
  {
    key: 'shares',
    label: 'Held qty',
    tooltip: 'Current held quantity by category.',
  },
  {
    key: 'profit',
    label: 'Realized',
    tooltip: 'Positive all-time realized item profit by category from tracked stock totals.',
  },
  {
    key: 'unrealizedProfit',
    label: 'Unrealized',
    tooltip: 'Positive unrealized profit by category using live GE high after tax.',
  },
  {
    key: 'soldCost',
    label: 'Sold GP',
    tooltip: 'All-time sell value by category from tracked stock totals.',
  },
  {
    key: 'soldShares',
    label: 'Sold qty',
    tooltip: 'All-time sold quantity by category from tracked stock totals.',
  },
];

function DonutTooltip({ active, payload, numberFormat }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const row = entry.payload;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{entry.name}</div>
      <div className="analytics-tooltip-row">
        <span>Value</span>
        <span className="analytics-tooltip-value">
          {formatNumber(row.value, numberFormat)}
        </span>
      </div>
    </div>
  );
}

export default function CategoryShareDonut({ stocks = [], gePrices = {}, numberFormat }) {
  const [metric, setMetric] = useState('totalCost');
  const data = computeCategoryShareSnapshot({ stocks, metric, gePrices });
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const chartTotal = data.reduce((sum, slice) => sum + slice.chartValue, 0);
  const activeMetric = METRICS.find((option) => option.key === metric);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Category allocation for the selected metric. Snapshot metrics come from stock totals and live GE prices, not the selected analytics timeframe."
        >
          Category allocation
        </h3>
        <div className="analytics-widget-controls analytics-segmented" aria-label="Category share metric">
          {METRICS.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`analytics-segmented-btn has-tooltip${metric === option.key ? ' is-active' : ''}`}
              data-tooltip={option.tooltip}
              onClick={() => setMetric(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="analytics-widget-empty">No positive values for this metric.</div>
      ) : (
        <div className="category-allocation-layout">
          <div className="analytics-widget-body analytics-chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="chartValue"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={94}
                  paddingAngle={2}
                >
                  {data.map((slice) => (
                    <Cell key={slice.name} fill={getCategoryColor(slice.name)} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip numberFormat={numberFormat} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="category-allocation-summary">
            <div
              className="category-allocation-total has-tooltip"
              data-tooltip={activeMetric?.tooltip}
            >
              <span>{activeMetric?.label} total</span>
              <strong>{formatNumber(total, numberFormat)}</strong>
            </div>
            <div className="category-allocation-list" aria-label="Category allocation values">
              {data.map((slice, index) => (
                <div
                  className="category-allocation-row has-tooltip"
                  data-tooltip={`${slice.name}: ${formatNumber(slice.value, numberFormat)} (${chartTotal > 0 ? ((slice.chartValue / chartTotal) * 100).toFixed(1) : '0.0'}% of chart area)`}
                  key={slice.name}
                >
                  <span className={`analytics-legend-swatch category-color-${getCategoryColorIndex(slice.name)}`} aria-hidden="true" />
                  <span className="category-allocation-name">{slice.name}</span>
                  <span className="category-allocation-value">
                    {formatNumber(slice.value, numberFormat)}
                  </span>
                  <span className="category-allocation-pct">
                    {chartTotal > 0 ? `${((slice.chartValue / chartTotal) * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
