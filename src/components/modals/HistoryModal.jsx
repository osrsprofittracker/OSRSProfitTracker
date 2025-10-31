import React, { useState } from 'react';

export default function HistoryModal({ stock, transactions, onCancel }) {
  const [filter, setFilter] = useState('all'); // 'all', 'buy', 'sell'

  const stockTransactions = transactions
    .filter(t => t.stockId === stock.id)
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Transaction History - {stock.name}
      </h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['all', 'buy', 'sell'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: filter === f 
                ? (f === 'all' ? 'rgb(37, 99, 235)' : f === 'buy' ? 'rgb(21, 128, 61)' : 'rgb(185, 28, 28)')
                : 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background 0.2s',
              textTransform: 'capitalize'
            }}
            onMouseOver={(e) => {
              if (filter !== f) e.currentTarget.style.background = 'rgb(51, 65, 85)';
            }}
            onMouseOut={(e) => {
              if (filter !== f) e.currentTarget.style.background = 'rgb(71, 85, 105)';
            }}
          >
            {f === 'all' ? 'All' : f === 'buy' ? 'Buys' : 'Sales'}
          </button>
        ))}
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {stockTransactions.map(t => (
          <div key={t.id} style={{
            padding: '0.75rem',
            marginBottom: '0.5rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            borderLeft: `4px solid ${t.type === 'buy' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{
                fontWeight: '600',
                color: t.type === 'buy' ? 'rgb(134, 239, 172)' : 'rgb(252, 165, 165)',
                textTransform: 'uppercase',
                fontSize: '0.875rem'
              }}>
                {t.type}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
              {t.shares.toLocaleString()} shares @ ${t.price.toFixed(2)} = ${t.total.toLocaleString()}
            </div>
          </div>
        ))}
        {stockTransactions.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgb(156, 163, 175)', padding: '2rem' }}>
            No transactions yet
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid rgb(71, 85, 105)' }}>
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
          Close
        </button>
      </div>
    </div>
  );
}