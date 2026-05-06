import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const SOURCES = [
  { key: 'profit_items', label: 'Items', color: 'rgb(96, 165, 250)' },
  { key: 'profit_dump', label: 'Dump', color: 'rgb(52, 211, 153)' },
  { key: 'profit_referral', label: 'Referral', color: 'rgb(168, 85, 247)' },
  { key: 'profit_bonds', label: 'Bonds', color: 'rgb(234, 179, 8)' },
];

const getStackDomain = (data) => {
  let maxPositive = 0;
  let minNegative = 0;

  for (const bucket of data) {
    let positive = 0;
    let negative = 0;

    for (const source of SOURCES) {
      const value = Number(bucket[source.key] || 0);
      if (value >= 0) positive += value;
      else negative += value;
    }

    maxPositive = Math.max(maxPositive, positive);
    minNegative = Math.min(minNegative, negative);
  }

  const top = maxPositive > 0 ? Math.ceil(maxPositive * 1.08) : 1;
  if (minNegative < 0) {
    return [Math.floor(minNegative * 1.08), top];
  }

  return [0, top];
};

function SourceTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      {payload.map((entry) => (
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

export default function ProfitBySourceChart({ buckets = [], numberFormat }) {
  const data = buckets.map((bucket) => ({
    date: bucket.bucket_date,
    ...bucket,
  }));
  const yDomain = getStackDomain(data);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Breaks each period's realized profit into item sales, dump profit, referral profit, and bonds profit."
        >
          Profit by source
        </h3>
        <div className="analytics-legend" aria-label="Profit source legend">
          {SOURCES.map((source) => (
            <span className="analytics-legend-item" key={source.key}>
              <span
                className="analytics-legend-swatch"
                aria-hidden="true"
                data-color={source.key}
              />
              {source.label}
            </span>
          ))}
        </div>
      </div>
      <div className="analytics-widget-body analytics-chart-medium">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              domain={yDomain}
              tickFormatter={(value) => formatNumber(value, numberFormat)}
            />
            <ReferenceLine y={0} stroke="rgb(148, 163, 184)" strokeWidth={1.5} />
            <Tooltip content={<SourceTooltip numberFormat={numberFormat} />} />
            {SOURCES.map((source) => (
              <Bar
                key={source.key}
                dataKey={source.key}
                stackId="profit"
                fill={source.color}
                name={source.label}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
