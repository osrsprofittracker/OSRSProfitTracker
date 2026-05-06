import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { computeHitRateSeries } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

const ROLLING_WINDOW = 7;

function HitRateTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">
        {label} - {row.hits} of {row.windowSize} periods hit
      </div>
      <div className="analytics-tooltip-row">
        <span>Hit rate</span>
        <span className="analytics-tooltip-value">{row.rate}%</span>
      </div>
    </div>
  );
}

export default function GoalHitRateChart({ milestoneHistory = [] }) {
  const [period, setPeriod] = useState('day');

  const data = useMemo(() => (
    computeHitRateSeries(milestoneHistory, period, ROLLING_WINDOW).map((point) => ({
      date: point.date,
      rate: Math.round(point.rate * 100),
      hits: point.hits,
      windowSize: point.windowSize,
    }))
  ), [milestoneHistory, period]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip={`Share of completed ${period} goal periods that hit their target, smoothed across the last ${ROLLING_WINDOW} periods. Source: milestone history (completed periods only).`}
        >
          Goal hit rate
        </h3>
        <div className="analytics-widget-controls">
          <div className="analytics-segmented" aria-label="Hit rate period">
            {PERIODS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`analytics-segmented-btn has-tooltip${period === option.key ? ' is-active' : ''}`}
                data-tooltip={`Group hit rate by completed ${option.label.toLowerCase()} periods.`}
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="analytics-widget-body analytics-chart-medium">
        {data.length === 0 ? (
          <div className="analytics-widget-empty">
            No completed {period} periods yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="rgb(148, 163, 184)" fontSize={11} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="rgb(148, 163, 184)"
                fontSize={11}
              />
              <ReferenceLine
                y={50}
                stroke="rgb(71, 85, 105)"
                strokeDasharray="3 3"
              />
              <Tooltip content={<HitRateTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="rgb(168, 85, 247)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
