import React, { useEffect } from 'react';
import { formatNumber } from '../../utils/formatters';

export default function MilestoneCelebrationModal({ period, goalAmount, actualAmount, onClose, numberFormat }) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const periodLabels = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))',
        padding: '3rem',
        borderRadius: '1rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        animation: 'scaleIn 0.5s ease',
        maxWidth: '90vw'
      }}>
        {/* Celebration Emoji */}
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>
          🎉
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
          Milestone Achieved!
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1.5rem' }}>
          {periodLabels[period]} Goal Completed
        </p>

        {/* Stats */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>
            Goal
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            {formatNumber(goalAmount, numberFormat)}
          </div>
          
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>
            You Earned
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white' }}>
            {formatNumber(actualAmount, numberFormat)}
          </div>
          
          {actualAmount > goalAmount && (
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)', marginTop: '0.5rem' }}>
              +{formatNumber(actualAmount - goalAmount, numberFormat)} over goal! 🔥
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'rgb(22, 163, 74)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Awesome!
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}