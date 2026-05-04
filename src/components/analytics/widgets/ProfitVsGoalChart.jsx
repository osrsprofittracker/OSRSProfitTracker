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
import { formatNumber } from '../../../utils/formatters';
import { periodDate } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

function ProfitGoalTooltip({ active, payload, label, numberFormat }) {
  if (!active || !payload?.length) return null;

  const profitRow = payload.find((entry) => entry.dataKey === 'profit');
  const goalRow = payload.find((entry) => entry.dataKey === 'goal');
  const profit = Number(profitRow?.value || 0);
  const goal = Number(goalRow?.value || 0);
  const delta = profit - goal;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{label}</div>
      <div className="analytics-tooltip-row">
        <span>Profit</span>
        <span className="analytics-tooltip-value">{formatNumber(profit, numberFormat)}</span>
      </div>
      <div className="analytics-tooltip-row">
        <span>Goal</span>
        <span className="analytics-tooltip-value">{formatNumber(goal, numberFormat)}</span>
      </div>
      <div className="analytics-tooltip-row">
        <span>Delta</span>
        <span
          className={`analytics-tooltip-value ${delta >= 0 ? 'analytics-profit-positive' : 'analytics-profit-negative'}`}
        >
          {delta >= 0 ? '+' : '-'}{formatNumber(Math.abs(delta), numberFormat)}
        </span>
      </div>
    </div>
  );
}

export default function ProfitVsGoalChart({ milestoneHistory = [], numberFormat }) {
  const [period, setPeriod] = useState('day');

  const data = useMemo(() => (
    milestoneHistory
      .filter((entry) => entry.period === period && periodDate(entry))
      .sort((a, b) => periodDate(a).localeCompare(periodDate(b)))
      .map((entry) => ({
        date: periodDate(entry),
        profit: entry.actual_amount || 0,
        goal: entry.goal_amount || 0,
      }))
  ), [milestoneHistory, period]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Realised profit per completed goal period plotted against the goal that was active when each period closed. Source: milestone history."
        >
          Profit vs goal
        </h3>
        <div className="analytics-widget-controls">
          <div className="analytics-segmented" aria-label="Profit vs goal period">
            {PERIODS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`analytics-segmented-btn has-tooltip${period === option.key ? ' is-active' : ''}`}
                data-tooltip={`Plot completed ${option.label.toLowerCase()} periods.`}
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
                stroke="rgb(148, 163, 184)"
                fontSize={11}
                tickFormatter={(value) => formatNumber(value, numberFormat)}
              />
              <ReferenceLine y={0} stroke="rgb(71, 85, 105)" />
              <Tooltip content={<ProfitGoalTooltip numberFormat={numberFormat} />} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="rgb(34, 197, 94)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="goal"
                name="Goal at close"
                stroke="rgb(168, 85, 247)"
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      {data.length > 0 && (
        <div className="analytics-legend goal-vs-profit-legend">
          <span className="analytics-legend-item">
            <span className="analytics-legend-swatch goal-swatch-profit" />
            Profit
          </span>
          <span className="analytics-legend-item">
            <span className="analytics-legend-swatch goal-swatch-goal" />
            Goal at close
          </span>
        </div>
      )}
    </div>
  );
}
