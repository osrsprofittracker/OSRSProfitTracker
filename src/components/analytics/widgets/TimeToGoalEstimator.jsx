import React from 'react';
import {
  estimateTimeToGoal,
  periodElapsedDays,
  periodTotalDays,
} from '../../../utils/goalAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PERIODS = [
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

const formatDayCount = (days) => {
  if (!Number.isFinite(days)) return 'pace too slow';
  const rounded = Math.max(0, Math.ceil(days));
  if (rounded === 0) return 'goal reached';
  return `${rounded.toLocaleString()} day${rounded === 1 ? '' : 's'}`;
};

function Card({ period, label, currentProgress, goal, numberFormat }) {
  if (!goal) {
    return (
      <div
        className="analytics-kpi-mini has-tooltip"
        data-tooltip={`No ${label.toLowerCase()} goal configured. Set one in the milestones panel to see a pace estimate here.`}
      >
        <div className="analytics-kpi-mini-label">{label} goal</div>
        <div className="analytics-kpi-mini-value">-</div>
        <div className="analytics-kpi-mini-delta is-neutral">No goal set</div>
      </div>
    );
  }

  const totalDays = periodTotalDays(period);
  const elapsedDays = periodElapsedDays(period);
  const result = estimateTimeToGoal({
    currentProgress,
    goal,
    elapsedDays,
    totalDays,
  });
  const remainingGp = Math.max(0, goal - currentProgress);
  const pacePerDay = result.pacePerDay || 0;
  const projection = result.projected || 0;
  const statusClass = result.onTrack ? 'is-positive' : 'is-negative';
  const statusLabel = result.onTrack ? 'On track' : 'Behind pace';

  const tooltip = [
    `Goal: ${formatNumber(goal, 'full')} GP this ${label.toLowerCase()} period.`,
    `Elapsed: ${elapsedDays.toFixed(1)} of ${totalDays} days.`,
    `Pace: ${formatNumber(pacePerDay, numberFormat)} GP/day -> projected ${formatNumber(projection, numberFormat)} GP.`,
    `Remaining: ${formatNumber(remainingGp, numberFormat)} GP. Source: in-progress milestone period.`,
  ].join('\n');

  return (
    <div className="analytics-kpi-mini has-tooltip" data-tooltip={tooltip}>
      <div className="analytics-kpi-mini-label">{label} goal</div>
      <div className="analytics-kpi-mini-value">{formatDayCount(result.daysRemaining)}</div>
      <div className={`analytics-kpi-mini-delta ${statusClass}`}>
        {statusLabel} - {formatNumber(currentProgress, numberFormat)} / {formatNumber(goal, numberFormat)}
      </div>
    </div>
  );
}

export default function TimeToGoalEstimator({
  milestones,
  milestoneProgress,
  numberFormat,
}) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Days needed to hit each goal at the current in-progress period's pace. Source: live progress (not milestone history)."
        >
          Time to goal
        </h3>
        <p className="analytics-widget-subtitle">At current pace</p>
      </div>
      <div className="analytics-kpi-strip goal-estimator-strip">
        {PERIODS.map((option) => (
          <Card
            key={option.key}
            period={option.key}
            label={option.label}
            currentProgress={milestoneProgress?.[option.key] || 0}
            goal={milestones?.[option.key]?.goal || 0}
            numberFormat={numberFormat}
          />
        ))}
      </div>
    </div>
  );
}
