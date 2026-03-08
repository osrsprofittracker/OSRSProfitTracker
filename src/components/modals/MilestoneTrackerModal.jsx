import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

const formatPeriodRange = (periodStart, period) => {
  // Parse as local date (YYYY-MM-DD) to avoid UTC shift issues
  const parts = periodStart.split('-');
  const localStart = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

  switch (period) {
    case 'day':
      return localStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'week': {
      const end = new Date(localStart);
      end.setDate(end.getDate() + 6);
      const startStr = localStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    case 'month':
      return localStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'year':
      return localStart.getFullYear().toString();
    default:
      return periodStart;
  }
};

export default function MilestoneTrackerModal({
  milestones,
  currentProgress,
  milestoneHistory,
  initialView,
  onUpdateMilestone,
  onCancel,
  numberFormat,
  PRESET_GOALS
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [editingGoal, setEditingGoal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [showHistory, setShowHistory] = useState(initialView === 'history');

  const periods = [
    { key: 'day', label: 'Day', emoji: '☀️' },
    { key: 'week', label: 'Week', emoji: '📅' },
    { key: 'month', label: 'Month', emoji: '📊' },
    { key: 'year', label: 'Year', emoji: '🎯' }
  ];

  const currentMilestone = milestones[selectedPeriod];
  const progress = currentProgress[selectedPeriod] || 0;
  const percentage = currentMilestone.goal > 0 ? (progress / currentMilestone.goal) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const isComplete = progress >= currentMilestone.goal;

  const filteredHistory = (milestoneHistory || []).filter(r => r.period === selectedPeriod);

  const getResetTime = (period) => {
    const now = new Date();
    let resetDate = new Date();

    switch (period) {
      case 'day':
        resetDate.setDate(now.getDate() + 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        resetDate.setDate(now.getDate() + daysUntilMonday);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        resetDate.setMonth(now.getMonth() + 1, 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        resetDate.setFullYear(now.getFullYear() + 1, 0, 1);
        resetDate.setHours(0, 0, 0, 0);
        break;
    }

    const hoursLeft = Math.ceil((resetDate - now) / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);

    if (daysLeft > 0) return `Resets in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    return `Resets in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
  };

  const handleGoalSelect = (goal) => {
    onUpdateMilestone(selectedPeriod, goal, true);
    setEditingGoal(false);
    setCustomGoal('');
  };

  const handleCustomGoalSubmit = () => {
    const goal = parseFloat(customGoal);
    if (goal && goal > 0) {
      onUpdateMilestone(selectedPeriod, goal, true);
      setEditingGoal(false);
      setCustomGoal('');
    }
  };

  const periodTabRow = (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      background: 'rgb(15, 23, 42)',
      padding: '0.25rem',
      borderRadius: '0.5rem'
    }}>
      {periods.map(period => (
        <button
          key={period.key}
          onClick={() => setSelectedPeriod(period.key)}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: selectedPeriod === period.key ? 'rgb(37, 99, 235)' : 'transparent',
            border: 'none',
            borderRadius: '0.375rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
        >
          {period.emoji} {period.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '32rem',
      maxWidth: '90vw',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎯 Milestone Tracker
        </h2>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgb(156, 163, 175)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {showHistory ? (
        <>
          {/* Back button */}
          <button
            onClick={() => setShowHistory(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgb(156, 163, 175)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            ← Back
          </button>

          {periodTabRow}

          {/* History list */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {filteredHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'rgb(156, 163, 175)',
                padding: '2rem 0',
                fontSize: '0.875rem'
              }}>
                No history yet
              </div>
            ) : (
              filteredHistory.map((record) => {
                const hit = record.actual_amount >= record.goal_amount;
                return (
                  <div
                    key={record.id}
                    style={{
                      background: 'rgb(15, 23, 42)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      border: '1px solid rgb(51, 65, 85)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        {record.period_start ? formatPeriodRange(record.period_start, record.period) : '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                        {formatNumber(record.actual_amount, numberFormat)} / {formatNumber(record.goal_amount, numberFormat)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      background: hit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: hit ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                      whiteSpace: 'nowrap'
                    }}>
                      {hit ? '✓ Hit' : '✗ Missed'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Done button */}
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgb(37, 99, 235)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(37, 99, 235)'}
          >
            Done
          </button>
        </>
      ) : (
        <>
          {periodTabRow}

          {/* Progress Display */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgb(15, 23, 42)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgb(51, 65, 85)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgb(156, 163, 175)' }}>Progress</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: isComplete ? 'rgb(34, 197, 94)' : 'white' }}>
                  {percentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '1rem',
                background: 'rgb(51, 65, 85)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: `${displayPercentage}%`,
                  height: '100%',
                  background: isComplete
                    ? 'linear-gradient(90deg, rgb(34, 197, 94), rgb(22, 163, 74))'
                    : percentage > 75
                      ? 'linear-gradient(90deg, rgb(234, 179, 8), rgb(202, 138, 4))'
                      : 'linear-gradient(90deg, rgb(59, 130, 246), rgb(37, 99, 235))',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>

              {/* Amount Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: isComplete ? 'rgb(34, 197, 94)' : 'white' }}>
                    {formatNumber(progress, numberFormat)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginTop: '0.25rem' }}>
                    of {formatNumber(currentMilestone.goal, numberFormat)}
                  </div>
                </div>
                {isComplete && (
                  <div style={{ fontSize: '2rem' }}>🎉</div>
                )}
              </div>

              {/* Reset Timer */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgb(51, 65, 85)',
                fontSize: '0.75rem',
                color: 'rgb(156, 163, 175)',
                textAlign: 'center'
              }}>
                ⏱️ {getResetTime(selectedPeriod)}
              </div>
            </div>
          </div>

          {/* Goal Selection */}
          {editingGoal ? (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Select Goal Amount
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {PRESET_GOALS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => handleGoalSelect(goal)}
                    style={{
                      padding: '0.75rem',
                      background: currentMilestone.goal === goal ? 'rgb(37, 99, 235)' : 'rgb(51, 65, 85)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {formatNumber(goal, numberFormat)}
                  </button>
                ))}
              </div>

              {/* Custom Goal Input */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.5rem' }}>
                  Or enter custom amount:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Enter custom goal"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgb(15, 23, 42)',
                      border: '1px solid rgb(51, 65, 85)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={handleCustomGoalSubmit}
                    disabled={!customGoal || parseFloat(customGoal) <= 0}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: (!customGoal || parseFloat(customGoal) <= 0)
                        ? 'rgb(71, 85, 105)'
                        : 'rgb(34, 197, 94)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      cursor: (!customGoal || parseFloat(customGoal) <= 0) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>

              <button
                onClick={() => setEditingGoal(false)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid rgb(71, 85, 105)',
                  borderRadius: '0.5rem',
                  color: 'rgb(156, 163, 175)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingGoal(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.75rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            >
              Change Goal
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgb(37, 99, 235)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(37, 99, 235)'}
          >
            Done
          </button>
        </>
      )}
    </div>
  );
}
