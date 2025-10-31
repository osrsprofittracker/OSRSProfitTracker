import React, { useState } from 'react';

export default function ProfitModal({ type, onConfirm, onCancel }) {
  const [amount, setAmount] = useState('');

  const handleConfirm = () => {
    if (!amount) return;
    onConfirm(parseFloat(amount));
  };

  const config = {
    dump: {
      title: 'Add Dump Profit',
      color: 'rgb(16, 185, 129)',
      hoverColor: 'rgb(5, 150, 105)'
    },
    referral: {
      title: 'Add Referral Profit',
      color: 'rgb(126, 34, 206)',
      hoverColor: 'rgb(107, 33, 168)'
    },
    bonds: {
      title: 'Add Bonds Profit',
      color: 'rgb(161, 98, 7)',
      hoverColor: 'rgb(133, 77, 14)'
    }
  };

  const { title, color, hoverColor } = config[type] || config.dump;

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter profit amount"
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            outline: 'none',
            border: '2px solid transparent',
            color: 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = color}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: color,
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = hoverColor}
            onMouseOut={(e) => e.currentTarget.style.background = color}
          >
            Add
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}