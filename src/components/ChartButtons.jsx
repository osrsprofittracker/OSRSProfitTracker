import React from 'react';

export default function ChartButtons({ onShowProfitChart, onShowCategoryChart }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={onShowProfitChart}
        style={{
          padding: '0.75rem 2rem',
          background: 'linear-gradient(to right, rgb(67, 56, 202), rgb(147, 51, 234))',
          borderRadius: '0.75rem',
          border: 'none',
          color: 'white',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(55, 48, 163), rgb(126, 34, 206))'}
        onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(67, 56, 202), rgb(147, 51, 234))'}
      >
        📊 View Profit Breakdown
      </button>

      <button
        onClick={onShowCategoryChart}
        style={{
          padding: '0.75rem 2rem',
          background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
          borderRadius: '0.75rem',
          border: 'none',
          color: 'white',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'}
        onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))'}
      >
        📈 Category Comparison
      </button>
    </div>
  );
}