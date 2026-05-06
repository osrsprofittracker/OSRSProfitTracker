import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { computeAvgVsGoal } from '../../../utils/goalAnalytics';
import { formatNumber } from '../../../utils/formatters';

const PERIODS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

function deltaPresentation(deltaPct) {
  if (deltaPct == null) {
    return { className: 'is-neutral', Icon: Minus, label: 'No prior data' };
  }
  if (Math.abs(deltaPct) < 0.1) {
    return { className: 'is-neutral', Icon: Minus, label: '0.0% vs goal' };
  }
  return {
    className: deltaPct >= 0 ? 'is-positive' : 'is-negative',
    Icon: deltaPct >= 0 ? ArrowUp : ArrowDown,
    label: `${Math.abs(deltaPct).toFixed(1)}% vs goal`,
  };
}

function Card({ period, label, milestoneHistory, currentGoal, numberFormat }) {
  const partialCount = milestoneHistory.filter(
    (entry) => entry.period === period && entry.isPartial,
  ).length;
  const fullHistory = milestoneHistory.filter((entry) => !entry.isPartial);
  const { avg, samples } = computeAvgVsGoal(fullHistory, period);
  const deltaPct = currentGoal > 0 && samples > 0
    ? ((avg - currentGoal) / currentGoal) * 100
    : null;
  const { className, Icon, label: deltaLabel } = deltaPresentation(deltaPct);

  const partialNote = partialCount > 0
    ? ` ${partialCount} partial period${partialCount === 1 ? '' : 's'} excluded.`
    : '';
  const goalNote = currentGoal > 0
    ? ` Compared against your currently active ${label.toLowerCase()} goal of ${formatNumber(currentGoal, 'full')} GP; past periods may have closed under different goals.`
    : ` No active ${label.toLowerCase()} goal is set.`;
  const tooltip = samples === 0
    ? `No fully completed ${label.toLowerCase()} periods on record yet.${partialNote}${goalNote}`
    : `Average actual across ${samples} fully completed ${label.toLowerCase()} period${samples === 1 ? '' : 's'}.${partialNote}${goalNote} Source: milestone history.`;

  const goalLabel = currentGoal > 0
    ? formatNumber(Math.round(currentGoal), numberFormat)
    : 'no goal';

  return (
    <div className="analytics-kpi-mini has-tooltip" data-tooltip={tooltip}>
      <div className="analytics-kpi-mini-label">{label} avg vs goal</div>
      <div className="analytics-kpi-mini-value">
        {samples === 0 ? '-' : formatNumber(Math.round(avg), numberFormat)}
      </div>
      {samples === 0 ? (
        <div className="analytics-kpi-mini-delta is-neutral">
          {partialCount > 0
            ? `Need 1 full period (goal ${goalLabel})`
            : `Need 1 full period (goal ${goalLabel})`}
        </div>
      ) : currentGoal > 0 ? (
        <div className={`analytics-kpi-mini-delta goal-avg-delta ${className}`}>
          <Icon size={12} aria-hidden="true" />
          <span>{deltaLabel} (goal {goalLabel})</span>
        </div>
      ) : (
        <div className="analytics-kpi-mini-delta is-neutral">No goal set</div>
      )}
    </div>
  );
}

export default function AvgVsGoalKpis({ milestoneHistory = [], milestones, numberFormat }) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Average realised profit across fully completed periods, compared against your currently active goal for that period type. Live goal changes update the delta immediately."
        >
          Avg vs goal
        </h3>
      </div>
      <div className="analytics-kpi-strip goal-avg-strip">
        {PERIODS.map((option) => (
          <Card
            key={option.key}
            period={option.key}
            label={option.label}
            milestoneHistory={milestoneHistory}
            currentGoal={milestones?.[option.key]?.goal || 0}
            numberFormat={numberFormat}
          />
        ))}
      </div>
    </div>
  );
}
