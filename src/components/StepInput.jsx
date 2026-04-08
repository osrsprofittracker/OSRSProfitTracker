import React from 'react';

export default function StepInput({ onStep, className, wrapperStyle, ...props }) {
  return (
    <div className="input-step-wrapper" style={wrapperStyle}>
      <input
        className={`input-step-field${className ? ` ${className}` : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); onStep(1); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); onStep(-1); }
        }}
        {...props}
      />
      <div className="input-step-btns">
        <button type="button" className="input-step-btn" onClick={() => onStep(1)}>▲</button>
        <button type="button" className="input-step-btn" onClick={() => onStep(-1)}>▼</button>
      </div>
    </div>
  );
}
