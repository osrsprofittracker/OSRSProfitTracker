import React from 'react';
import { formatNumber } from '../utils/formatters';

export default function MilestoneProgressBar({
  milestones,
  currentProgress,
  selectedPeriod,
  onPeriodChange,
  onOpenModal,
  numberFormat
}) {
  const periods = [
    { key: 'day', label: 'Day', emoji: '☀️' },
    { key: 'week', label: 'Week', emoji: '📅' },
    { key: 'month', label: 'Month', emoji: '📊' },
    { key: 'year', label: 'Year', emoji: '🎯' }
  ];

  const currentMilestone = milestones[selectedPeriod];
  const progress = currentProgress[selectedPeriod] || 0;
  const percentage = currentMilestone?.goal > 0 ? Math.min((progress / currentMilestone.goal) * 100, 100) : 0;
  const isComplete = currentMilestone && progress >= currentMilestone.goal;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      width: 'auto',
      minWidth: '400px',
      maxWidth: '450px',
      background: 'rgb(30, 41, 59)',
      borderRadius: '0.75rem',
      border: '1px solid rgb(51, 65, 85)',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      minHeight: '80px'
    }}>
      {/* Left side - Goals button and dropdown stacked */}
      <div style={{
        background: 'rgb(15, 23, 42)',
        borderRight: '1px solid rgb(51, 65, 85)',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: '120px'
      }}>
        {/* Set Goals Button */}
        <button
          onClick={onOpenModal}
          style={{
            padding: '0.375rem 0.5rem',
            background: 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '600',
            borderRadius: '0.375rem',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgb(124, 58, 237), rgb(91, 33, 182))';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))';
          }}
        >
          🎯 Set Goals
        </button>

        {/* Period Dropdown */}
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          style={{
            background: 'rgb(51, 65, 85)',
            color: 'white',
            border: '1px solid rgb(71, 85, 105)',
            borderRadius: '0.375rem',
            padding: '0.375rem 0.25rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            outline: 'none',
            flex: 1
          }}
        >
          {periods.map(period => (
            <option key={period.key} value={period.key}>
              {period.emoji} {period.label}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Bar Section */}
      <div style={{
        flex: 1,
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.375rem',
        minWidth: '0'
      }}>
        {/* Title */}
        <div style={{
          fontSize: '0.875rem',
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          background: 'linear-gradient(90deg, rgb(139, 92, 246), rgb(59, 130, 246))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎯 Milestone Progress
        </div>

        {/* Header with amount */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <div>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: isComplete ? 'rgb(34, 197, 94)' : 'white'
            }}>
              {formatNumber(progress, numberFormat)}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'rgb(156, 163, 175)',
              marginLeft: '0.5rem'
            }}>
              / {formatNumber(currentMilestone?.goal || 0, numberFormat)}
            </span>
          </div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isComplete ? 'rgb(34, 197, 94)' : 'white'
          }}>
            {percentage.toFixed(1)}%
          </div>
        </div>

        {/* Progress Ba */}
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'rgb(51, 65, 85)',
          borderRadius: '4px',
          border: '1px solid rgb(71, 85, 105)',
          position: 'relative',
          overflow: 'hidden',
          minWidth: '0'
        }}>
          {/* Actual progress bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            background: percentage < 10
              ? 'rgb(59, 130, 246)'  // Solid blue for very low percentages
              : `linear-gradient(90deg, 
        rgb(59, 130, 246) 0%, 
        rgb(34, 197, 94) 100%)`,
            transition: 'width 0.5s ease',
            borderRadius: '3px'
          }}></div>
        </div>
      </div>
    </div>
  );
}