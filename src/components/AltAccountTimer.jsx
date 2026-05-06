import React from 'react';
import { Bell, Clock, RotateCcw } from 'lucide-react';
import '../styles/alt-account-timer.css';

export default function AltAccountTimer({
  altAccountTimer,
  onSetAltTimer,
  onResetAltTimer,
  currentTime,
}) {
  const formatTimeRemaining = (endTime) => {
    const remaining = endTime - currentTime;
    if (remaining <= 0) return 'Ready to Check!';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isReady = altAccountTimer && altAccountTimer <= currentTime;
  const isActive = altAccountTimer && altAccountTimer > currentTime;
  const stateClass = isReady ? 'is-ready' : isActive ? 'is-active' : 'is-idle';

  return (
    <div className={`alt-account-timer ${stateClass}`}>
      <div className="alt-account-timer-body">
        <span className="alt-account-timer-label">Alt Account Timer</span>
        <span className="alt-account-timer-value">
          {altAccountTimer ? formatTimeRemaining(altAccountTimer) : 'Not Set'}
        </span>
      </div>
      <div className="alt-account-timer-actions">
        <button
          type="button"
          onClick={onSetAltTimer}
          className="alt-account-timer-btn"
        >
          {altAccountTimer ? <Clock size={14} /> : <Bell size={14} />}
          {altAccountTimer ? 'Change' : 'Set Timer'}
        </button>
        {altAccountTimer && (
          <button
            type="button"
            onClick={onResetAltTimer}
            className="alt-account-timer-btn is-danger"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
