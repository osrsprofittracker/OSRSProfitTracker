import React, { useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { periodDate } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'all', label: 'All' },
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

const DEFAULT_VISIBLE = 25;

export default function MilestoneHistoryTable({ milestoneHistory = [], numberFormat }) {
  const [period, setPeriod] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const sortedAll = useMemo(() => (
    [...milestoneHistory].sort((a, b) => periodDate(b).localeCompare(periodDate(a)))
  ), [milestoneHistory]);

  const rows = useMemo(() => (
    period === 'all' ? sortedAll : sortedAll.filter((entry) => entry.period === period)
  ), [sortedAll, period]);

  const total = sortedAll.length;
  const filtered = rows.length;
  const exceedsDefault = filtered > DEFAULT_VISIBLE;
  const visibleRows = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Every recorded goal period and whether the target was hit. Source: milestone history (completed periods only)."
        >
          Milestone history
        </h3>
        <div className="analytics-widget-controls">
          <span className="analytics-widget-subtitle goal-history-count">
            {filtered.toLocaleString()} / {total.toLocaleString()} periods
          </span>
          <div className="analytics-segmented" aria-label="Milestone history filter">
            {PERIODS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`analytics-segmented-btn has-tooltip${period === option.key ? ' is-active' : ''}`}
                data-tooltip={
                  option.key === 'all'
                    ? 'Show every recorded period.'
                    : `Filter to completed ${option.label.toLowerCase()} periods.`
                }
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="analytics-widget-body goal-history-body">
        {filtered === 0 ? (
          <div className="analytics-widget-empty">No milestone history yet.</div>
        ) : (
          <>
            <div className="goal-history-scroll">
              <table className="analytics-bw-table">
                <thead>
                  <tr>
                    <th>
                      <span className="has-tooltip" data-tooltip="The goal cadence: day, week, month, or year.">
                        Period
                      </span>
                    </th>
                    <th>
                      <span className="has-tooltip" data-tooltip="Calendar start of this completed period.">
                        Start
                      </span>
                    </th>
                    <th>
                      <span className="has-tooltip" data-tooltip="Goal target in GP that was active when the period closed. Partial periods (joined mid-period) are scaled in tooltips.">
                        Goal
                      </span>
                    </th>
                    <th>
                      <span className="has-tooltip" data-tooltip="Realised profit attributed to this period at close.">
                        Actual
                      </span>
                    </th>
                    <th>
                      <span className="has-tooltip" data-tooltip="Hit means actual met or exceeded the goal (or its pro-rated value for partial periods).">
                        Result
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((entry, index) => {
                    const original = entry.original_goal_amount ?? entry.goal_amount ?? 0;
                    const effectiveGoal = entry.goal_amount || 0;
                    const hit = (entry.actual_amount || 0) >= effectiveGoal && effectiveGoal > 0;
                    const key = `${entry.period}-${periodDate(entry)}-${entry.achieved_at || index}`;
                    const partialTooltip = entry.isPartial
                      ? `Partial period: only ${entry.activeDays} of ${entry.totalDays} days were inside your activity window. Original goal ${formatNumber(original, numberFormat)} was scaled to ${formatNumber(effectiveGoal, numberFormat)} for the hit/miss judgment.`
                      : null;

                    return (
                      <tr key={key} className="analytics-bw-row">
                        <td>{entry.period}</td>
                        <td>{periodDate(entry)}</td>
                        <td>
                          <span>{formatNumber(original, numberFormat)}</span>
                          {entry.isPartial && (
                            <span
                              className="goal-partial-badge has-tooltip"
                              data-tooltip={partialTooltip}
                            >
                              Partial
                            </span>
                          )}
                        </td>
                        <td className={hit ? 'analytics-profit-positive' : 'analytics-profit-negative'}>
                          {formatNumber(entry.actual_amount, numberFormat)}
                        </td>
                        <td className={hit ? 'goal-result-hit' : 'goal-result-miss'}>
                          {hit ? 'Hit' : 'Miss'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {exceedsDefault && (
              <button
                type="button"
                className="analytics-toggle goal-history-toggle"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded
                  ? `Show top ${DEFAULT_VISIBLE}`
                  : `Show all ${filtered.toLocaleString()}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
