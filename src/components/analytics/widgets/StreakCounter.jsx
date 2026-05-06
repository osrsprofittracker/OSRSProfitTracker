import React from 'react';
import { Flame } from 'lucide-react';
import { computeStreaks } from '../../../utils/goalAnalytics';

const PERIODS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

export default function StreakCounter({ milestoneHistory = [] }) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Big number = longest consecutive hit run across the entire history. Below: current trailing run plus overall hit count. Source: milestone history."
        >
          Goal streaks
        </h3>
      </div>
      <div className="analytics-kpi-strip goal-streak-strip">
        {PERIODS.map((option) => {
          const { longest, current, hits, total } = computeStreaks(milestoneHistory, option.key);
          const tooltip = total === 0
            ? `No completed ${option.label.toLowerCase()} periods yet.`
            : `Longest = best consecutive ${option.label.toLowerCase()} hit run across all ${total} completed period${total === 1 ? '' : 's'}. Current = trailing run since the last miss. Hits = total hits.`;
          const currentClass = current > 0 ? 'is-positive' : 'is-neutral';

          return (
            <div
              key={option.key}
              className="analytics-kpi-mini has-tooltip"
              data-tooltip={tooltip}
            >
              <div className="analytics-kpi-mini-label goal-streak-label">
                <Flame size={12} aria-hidden="true" />
                <span>{option.label}</span>
              </div>
              <div className="analytics-kpi-mini-value">{longest}</div>
              {total === 0 ? (
                <div className="analytics-kpi-mini-delta is-neutral">No periods yet</div>
              ) : (
                <>
                  <div className={`analytics-kpi-mini-delta ${currentClass}`}>
                    Current: {current}
                  </div>
                  <div className="analytics-kpi-mini-delta is-neutral">
                    {hits} / {total} hits
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
