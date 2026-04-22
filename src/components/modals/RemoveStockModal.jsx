import React, { useState } from 'react';
import { formatNumber, handleMKInput } from '../../utils/formatters';
import StepInput from '../StepInput';

export default function RemoveStockModal({ stock, onConfirm, onCancel, isSubmitting = false }) {
  const [shares, setShares] = useState('');

  const handleSharesBlur = () => {
    // Simple trim; could extend with parseMK if needed for M/K suffixes
    if (shares && !isNaN(shares)) {
      setShares(Math.floor(parseFloat(shares)).toString());
    }
  };

  const handleConfirm = () => {
    if (!shares) return;
    const sharesNum = parseFloat(shares);

    if (sharesNum > stock.shares) {
      alert(`Cannot remove ${sharesNum} quantity. You only have ${stock.shares} quantity available.`);
      return;
    }

    if (sharesNum <= 0) {
      alert('Please enter a valid quantity to remove.');
      return;
    }

    onConfirm({ shares: sharesNum });
  };

  const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
  const costToRemove = shares && parseFloat(shares) > 0 ? avgBuy * parseFloat(shares) : 0;

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
        Remove {stock.name}
      </h2>

      <div style={{
        padding: '0.75rem',
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgb(168, 85, 247)',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgb(168, 85, 247)', fontWeight: '600' }}>
            Available: {formatNumber(stock.shares)} quantity
          </span>
          {shares && parseFloat(shares) > 0 && (
            <span style={{ fontSize: '0.875rem', color: 'rgb(156, 163, 175)', fontWeight: '500' }}>
              After: {formatNumber(stock.shares - parseFloat(shares))} quantity
            </span>
          )}
        </div>
      </div>

      {/* Cost Basis Info */}
      {shares && parseFloat(shares) > 0 && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(107, 114, 128, 0.1)',
          border: '1px solid rgb(107, 114, 128)',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
              Avg Buy Price:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
              {formatNumber(avgBuy, 'full')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
              Cost Basis Removed:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'rgb(248, 113, 113)' }}>
              {formatNumber(costToRemove, 'full')}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              Quantity (Max: {stock.shares?.toLocaleString()})
            </label>
            <button
              onClick={() => setShares(stock.shares.toString())}
              style={{
                padding: '0.25rem 0.75rem',
                background: 'rgb(168, 85, 247)',
                borderRadius: '0.375rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(147, 51, 234)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgb(168, 85, 247)'}
            >
              ALL
            </button>
          </div>
          <StepInput
            type="text"
            value={shares}
            onChange={(e) => handleMKInput(e.target.value, setShares)}
            onStep={(d) => setShares(prev => Math.max(0, Math.min(stock.shares, (parseFloat(prev) || 0) + d)).toString())}
            placeholder="Quantity (e.g. 10k)"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(168, 85, 247)'}
            onBlur={(e) => { handleSharesBlur(); e.target.style.borderColor = 'transparent'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: (isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 'rgb(100, 100, 100)'
                : 'rgb(168, 85, 247)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: (isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 'not-allowed'
                : 'pointer',
              fontWeight: '500',
              opacity: (isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 0.5
                : 1
            }}
            onMouseOver={(e) => {
              if (!isSubmitting && shares && parseFloat(shares) <= stock.shares && parseFloat(shares) > 0) {
                e.currentTarget.style.background = 'rgb(147, 51, 234)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting && shares && parseFloat(shares) <= stock.shares && parseFloat(shares) > 0) {
                e.currentTarget.style.background = 'rgb(168, 85, 247)';
              }
            }}
          >
            Confirm Remove
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
