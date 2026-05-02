import React from 'react';

export default function TimeframeSelector({ window, options, onChange }) {
  return (
    <div className="analytics-timeframe" role="tablist" aria-label="Timeframe">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={window === option}
          className={`analytics-timeframe-btn${window === option ? ' is-active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
