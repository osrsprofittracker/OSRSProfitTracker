import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatNumber } from '../../../utils/formatters';
import { totalProfit } from '../../../utils/analyticsHelpers';

function ProfitTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;
  const winRate = row.sells > 0 ? Math.round((row.wins / row.sells) * 100) : 0;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">
        {label} - {row.sells} sells - {winRate}% wins
      </div>
      <div className="analytics-tooltip-row">
        <span>Profit</span>
        <span className="analytics-tooltip-value">{formatNumber(row.profit, numberFormat)}</span>
      </div>
    </div>
  );
}

export default function ProfitOverTimeChart({ buckets = [], numberFormat }) {
  if (!buckets.length) {
    return (
      <div className="analytics-widget">
        <div className="analytics-widget-header">
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Net realized profit by bucket in the selected timeframe, including item, dump, referral, and bonds profit."
          >
            Profit over time
          </h3>
        </div>
        <div className="analytics-widget-empty">No activity in this window. Try a wider timeframe.</div>
      </div>
    );
  }

  const data = buckets.map((bucket) => ({
    date: bucket.bucket_date,
    profit: totalProfit(bucket),
    sells: Number(bucket.sells_count || 0),
    wins: Number(bucket.wins_count || 0),
  }));

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Net realized profit by bucket in the selected timeframe, including item, dump, referral, and bonds profit."
        >
          Profit over time
        </h3>
      </div>
      <div className="analytics-widget-body analytics-chart-tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              tickFormatter={(value) => formatNumber(value, numberFormat)}
            />
            <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
            <Tooltip content={<ProfitTooltip numberFormat={numberFormat} />} />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="rgb(34, 197, 94)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
