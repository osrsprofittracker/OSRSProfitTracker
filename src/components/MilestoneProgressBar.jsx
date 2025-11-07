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
  const isComplete = progress >= currentMilestone?.goal;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      width: '100%',
      maxWidth: '1400px',
      margin: '1rem auto',
      background: 'rgb(30, 41, 59)',
      borderRadius: '0.75rem',
      border: '1px solid rgb(51, 65, 85)',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Period Selector Tabs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(15, 23, 42)',
        borderRight: '1px solid rgb(51, 65, 85)'
      }}>
        {periods.map(period => (
          <button
            key={period.key}
            onClick={() => onPeriodChange(period.key)}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              background: selectedPeriod === period.key ? 'rgb(37, 99, 235)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid rgb(51, 65, 85)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: selectedPeriod === period.key ? '600' : '500',
              textAlign: 'left',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              if (selectedPeriod !== period.key) {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedPeriod !== period.key) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span>{period.emoji}</span>
            <span>{period.label}</span>
          </button>
        ))}
      </div>

      {/* Progress Bar Section */}
      <div style={{
        flex: 1,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.75rem'
      }}>
        {/* Header with amount */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isComplete ? 'rgb(34, 197, 94)' : 'white'
            }}>
              {formatNumber(progress, numberFormat)}
            </span>
            <span style={{
              fontSize: '0.875rem',
              color: 'rgb(156, 163, 175)',
              marginLeft: '0.5rem'
            }}>
              / {formatNumber(currentMilestone?.goal || 0, numberFormat)}
            </span>
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: isComplete ? 'rgb(34, 197, 94)' : 'white'
          }}>
            {percentage.toFixed(1)}%
            {isComplete && ' 🎉'}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '1.5rem',
          background: 'rgb(15, 23, 42)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          border: '1px solid rgb(51, 65, 85)',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: isComplete 
              ? 'linear-gradient(90deg, rgb(34, 197, 94), rgb(22, 163, 74))'
              : percentage > 75 
                ? 'linear-gradient(90deg, rgb(234, 179, 8), rgb(202, 138, 4))'
                : 'linear-gradient(90deg, rgb(59, 130, 246), rgb(37, 99, 235))',
            transition: 'width 0.5s ease',
            boxShadow: isComplete ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
          }}></div>
        </div>

        {/* Period label */}
        <div style={{
          fontSize: '0.75rem',
          color: 'rgb(156, 163, 175)',
          textAlign: 'center'
        }}>
          {periods.find(p => p.key === selectedPeriod)?.label} Milestone Progress
        </div>
      </div>

      {/* Milestones Button */}
      <button
        onClick={onOpenModal}
        style={{
          padding: '0 2rem',
          background: 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s',
          borderLeft: '1px solid rgb(51, 65, 85)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgb(124, 58, 237), rgb(91, 33, 182))';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))';
        }}
      >
        🎯 Milestones
      </button>
    </div>
  );
}