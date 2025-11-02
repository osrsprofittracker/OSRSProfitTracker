import React, { useState } from 'react';

export default function AltTimerModal({ onConfirm, onCancel }) {
  const [days, setDays] = useState(7);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (days > 0) {
      onConfirm(days);
    }
  };

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)',
      color: 'rgb(209, 213, 219)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ⏰ Set Alt Account Timer
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'rgb(156, 163, 175)', marginBottom: '1.5rem' }}>
        Set a reminder to check your alt accounts. The button will turn green when ready!
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Days until check:
          </label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            min="1"
            max="365"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgb(15, 23, 42)',
              border: '1px solid rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgb(34, 197, 94)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 163, 74)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(34, 197, 94)'}
          >
            Set Timer
          </button>
        </div>
      </form>
    </div>
  );
}