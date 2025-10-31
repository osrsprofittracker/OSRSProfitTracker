import React, { useState } from 'react';

export default function TimeCalculatorModal({ stock, onClose }) {
  const [targetAmount, setTargetAmount] = useState(stock.needed.toString());
  const [accountCount, setAccountCount] = useState('1');
  
  const currentAmount = stock.shares || 0;
  const limit4h = stock.limit4h || 0;
  const target = parseFloat(targetAmount) || 0;
  const accounts = parseInt(accountCount) || 1;
  
  const remaining = target - currentAmount;
  const cycles = remaining > 0 ? Math.ceil(remaining / (limit4h * accounts)) : 0;
  const hours = cycles * 4;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  const completionDate = new Date(Date.now() + hours * 60 * 60 * 1000);

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '28rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Time Calculator - {stock.name}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Target Amount
          </label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="Enter target amount"
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white',
              fontSize: '1rem'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(59, 130, 246)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Number of Accounts
          </label>
          <input
            type="number"
            value={accountCount}
            onChange={(e) => setAccountCount(e.target.value)}
            placeholder="Enter number of accounts"
            min="1"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white',
              fontSize: '1rem'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(59, 130, 246)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <div style={{
          background: 'rgb(51, 65, 85)',
          padding: '1rem',
          borderRadius: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Current Amount:</span>
            <span style={{ color: 'white', fontWeight: '500' }}>{currentAmount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Target Amount:</span>
            <span style={{ color: 'white', fontWeight: '500' }}>{target.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Remaining:</span>
            <span style={{ color: remaining > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)', fontWeight: '500' }}>
              {remaining.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>4H Limit:</span>
            <span style={{ color: 'white', fontWeight: '500' }}>{limit4h.toLocaleString()}</span>
          </div>
          <div style={{ height: '1px', background: 'rgb(71, 85, 105)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Cycles Needed:</span>
            <span style={{ color: 'rgb(59, 130, 246)', fontWeight: '600', fontSize: '1.125rem' }}>
              {cycles}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Time Required:</span>
            <span style={{ color: 'rgb(59, 130, 246)', fontWeight: '600', fontSize: '1.125rem' }}>
              {days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`}
            </span>
          </div>
          {remaining > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>Completion:</span>
              <span style={{ color: 'rgb(34, 197, 94)', fontWeight: '500' }}>
                {completionDate.toLocaleDateString()} {completionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgb(59, 130, 246)',
            borderRadius: '0.5rem',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}