import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '../../../utils/formatters';

function GpTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      {payload.map((entry) => (
        <div className="analytics-tooltip-row" key={entry.dataKey}>
          <span>{entry.name}</span>
          <span className="analytics-tooltip-value">
            {entry.name === 'GP traded' ? formatNumber(entry.value, numberFormat) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GpTradedChart({ buckets = [], numberFormat }) {
  const [showTxCount, setShowTxCount] = useState(false);
  const data = buckets.map((bucket) => ({
    date: bucket.bucket_date,
    gp_traded: Number(bucket.gp_traded || 0),
    sells: Number(bucket.sells_count || 0),
  }));

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Total GP value of transactions in each period. This includes buys and sells from transaction history."
        >
          GP traded over time
        </h3>
        <button
          type="button"
          className={`analytics-toggle has-tooltip${showTxCount ? ' is-on' : ''}`}
          data-tooltip="Adds a line showing how many sell transactions happened in each visible bucket."
          onClick={() => setShowTxCount((value) => !value)}
        >
          Overlay sell count
        </button>
      </div>
      <div className="analytics-widget-body analytics-chart-medium">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis
              yAxisId="left"
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              tickFormatter={(value) => formatNumber(value, numberFormat)}
            />
            {showTxCount && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="rgb(148, 163, 184)"
                fontSize={11}
              />
            )}
            <Tooltip content={<GpTooltip numberFormat={numberFormat} />} />
            <Bar yAxisId="left" dataKey="gp_traded" fill="rgb(96, 165, 250)" name="GP traded" />
            {showTxCount && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sells"
                stroke="rgb(234, 179, 8)"
                name="Sells"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
