import React from 'react';
import { Target } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import '../styles/milestone-progress-bar.css';

export default function MilestoneProgressBar({
  milestones,
  currentProgress,
  selectedPeriod,
  onPeriodChange,
  onOpenModal,
  numberFormat
}) {
  const periods = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' }
  ];

  const currentMilestone = milestones[selectedPeriod];
  const progress = currentProgress[selectedPeriod] || 0;
  const percentage = currentMilestone?.goal > 0 ? (progress / currentMilestone.goal) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const isComplete = currentMilestone && progress >= currentMilestone.goal;

  return (
    <div className="milestone-progress-bar">
      <div className="milestone-progress-controls">
        <button
          type="button"
          onClick={onOpenModal}
          className="milestone-progress-action"
        >
          <Target size={14} />
          Set Goals
        </button>

        <div className="milestone-progress-periods" aria-label="Milestone period">
          {periods.map(period => (
            <button
              type="button"
              key={period.key}
              className={`milestone-progress-period ${selectedPeriod === period.key ? 'is-active' : ''}`}
              onClick={() => onPeriodChange(period.key)}
              aria-pressed={selectedPeriod === period.key}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="milestone-progress-content">
        <div className="milestone-progress-title">Milestone Progress</div>

        <div className="milestone-progress-meta">
          <div>
            <span className={`milestone-progress-value ${isComplete ? 'is-complete' : ''}`}>
              {formatNumber(progress, numberFormat)}
            </span>
            <span className="milestone-progress-goal">
              / {formatNumber(currentMilestone?.goal || 0, numberFormat)}
            </span>
          </div>
          <div className={`milestone-progress-percent ${isComplete ? 'is-complete' : ''}`}>
            {percentage.toFixed(1)}%
          </div>
        </div>

        <progress
          className="milestone-progress-meter"
          max="100"
          value={displayPercentage}
          aria-label="Milestone progress"
        />
      </div>
    </div>
  );
}
