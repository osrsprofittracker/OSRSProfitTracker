import React from 'react';

export default function ChartButtons({ 
  onShowProfitChart, 
  onShowCategoryChart,
  altAccountTimer,
  onSetAltTimer,
  onResetAltTimer,
  currentTime
}) {
  const formatTimeRemaining = (endTime) => {
    const remaining = endTime - currentTime;
    if (remaining <= 0) return "Ready to Check!";
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isReady = altAccountTimer && altAccountTimer <= currentTime;
  const isActive = altAccountTimer && altAccountTimer > currentTime;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Alt Account Timer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 2rem',
        background: isReady 
          ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))'
          : isActive
          ? 'linear-gradient(to right, rgb(202, 138, 4), rgb(161, 98, 7))'
          : 'linear-gradient(to right, rgb(71, 85, 105), rgb(51, 65, 85))',
        borderRadius: '0.75rem',
        border: 'none',
        color: 'white',
        boxShadow: isReady 
          ? '0 0 20px rgba(34, 197, 94, 0.4), 0 4px 6px rgba(0, 0, 0, 0.1)'
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        animation: isReady ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            Alt Account Timer
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {altAccountTimer ? formatTimeRemaining(altAccountTimer) : 'Not Set'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onSetAltTimer}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            {altAccountTimer ? '⏰ Change' : '🔔 Set Timer'}
          </button>
          {altAccountTimer && (
            <button
              onClick={onResetAltTimer}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(220, 38, 38, 0.9)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(220, 38, 38, 1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.9)'}
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

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