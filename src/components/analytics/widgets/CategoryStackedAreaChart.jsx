import React from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getCategoryColor,
  getCategoryColorIndex,
  getCategoryStackDomain,
  pivotCategoryTimeseries,
} from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

function CategoryAreaTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      {payload
        .filter((entry) => Number(entry.value) !== 0)
        .map((entry) => (
          <div className="analytics-tooltip-row" key={entry.dataKey}>
            <span>{entry.name}</span>
            <span className="analytics-tooltip-value">
              {formatNumber(entry.value, numberFormat)}
            </span>
          </div>
        ))}
    </div>
  );
}

export default function CategoryStackedAreaChart({ buckets = [], numberFormat }) {
  const { rows, categories } = pivotCategoryTimeseries(buckets);
  const yDomain = getCategoryStackDomain(rows, categories);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Selected-timeframe realized item profit from analytics by-category buckets. The zero line stays visible when losses are present."
        >
          Category profit over time
        </h3>
        {categories.length > 0 && (
          <div className="analytics-legend" aria-label="Category color legend">
            {categories.map((category) => (
              <span
                className="analytics-legend-item has-tooltip"
                data-tooltip={`${category} uses the same color in this chart tooltip and area.`}
                key={category}
              >
                <span
                  className={`analytics-legend-swatch category-color-${getCategoryColorIndex(category)}`}
                  aria-hidden="true"
                />
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
      {categories.length === 0 ? (
        <div className="analytics-widget-empty">No category profit in this window.</div>
      ) : (
        <div className="analytics-widget-body analytics-chart-tall">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
              <YAxis
                stroke="rgb(148, 163, 184)"
                fontSize={11}
                domain={yDomain}
                tickFormatter={(value) => formatNumber(value, numberFormat)}
              />
              <ReferenceLine y={0} stroke="rgb(148, 163, 184)" strokeWidth={1.5} />
              <Tooltip content={<CategoryAreaTooltip numberFormat={numberFormat} />} />
              {categories.map((category) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={category}
                  stackId="category-profit"
                  stroke={getCategoryColor(category)}
                  fill={getCategoryColor(category)}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
