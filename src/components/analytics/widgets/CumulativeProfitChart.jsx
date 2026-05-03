import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const totalProfit = (bucket) => (
  Number(bucket.profit_items || 0)
  + Number(bucket.profit_dump || 0)
  + Number(bucket.profit_referral || 0)
  + Number(bucket.profit_bonds || 0)
);

function CumulativeTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      <div className="analytics-tooltip-row">
        <span>Cumulative</span>
        <span className="analytics-tooltip-value">
          {formatNumber(payload[0].value, numberFormat)}
        </span>
      </div>
    </div>
  );
}

export default function CumulativeProfitChart({
  buckets = [],
  initialBaseline = 0,
  numberFormat,
}) {
  const [includePrevious, setIncludePrevious] = useState(true);

  const data = useMemo(() => {
    let running = includePrevious ? initialBaseline : 0;

    return buckets.map((bucket) => {
      running += totalProfit(bucket);
      return {
        date: bucket.bucket_date,
        cumulative: running,
      };
    });
  }, [buckets, includePrevious, initialBaseline]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Running total of realized profit. By default, matching dates stay comparable across timeframes."
        >
          Cumulative profit
        </h3>
        <button
          type="button"
          className={`analytics-toggle has-tooltip${!includePrevious ? ' is-on' : ''}`}
          data-tooltip="When on, this resets the line to zero at the start of the selected window. Off keeps dates comparable across timeframes."
          onClick={() => setIncludePrevious((value) => !value)}
        >
          Window baseline
        </button>
      </div>
      <div className="analytics-widget-body analytics-chart-small">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cumulativeProfitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
            <YAxis
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              tickFormatter={(value) => formatNumber(value, numberFormat)}
            />
            <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
            <Tooltip content={<CumulativeTooltip numberFormat={numberFormat} />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="rgb(34, 197, 94)"
              fill="url(#cumulativeProfitGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
