import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatters';

export default function SellModal({ stock, onConfirm, onCancel }) {
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [useTotal, setUseTotal] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');

  React.useEffect(() => {
    const avgSell = stock.sharesSold > 0 ? stock.totalCostSold / stock.sharesSold : 0;
    setPrice((Math.round(avgSell * 100) / 100).toFixed(0));
  }, [stock]);

  const handleConfirm = () => {
    if (useTotal) {
      if (!shares || !totalAmount) return;
      const calculatedPrice = parseFloat(totalAmount) / parseFloat(shares);
      const sharesNum = parseFloat(shares);

      if (sharesNum > stock.shares) {
        alert(`Cannot sell ${sharesNum} shares. You only have ${stock.shares} shares available.`);
        return;
      }

      if (sharesNum <= 0) {
        alert('Please enter a valid number of shares to sell.');
        return;
      }

      onConfirm({
        shares: sharesNum,
        price: calculatedPrice
      });
    } else {
      if (!shares || !price) return;
      const sharesNum = parseFloat(shares);

      if (sharesNum > stock.shares) {
        alert(`Cannot sell ${sharesNum} shares. You only have ${stock.shares} shares available.`);
        return;
      }

      if (sharesNum <= 0) {
        alert('Please enter a valid number of shares to sell.');
        return;
      }

      onConfirm({
        shares: sharesNum,
        price: parseFloat(price)
      });
    }
  };

  const handleModeToggle = () => {
    if (!useTotal && price && shares) {
      setTotalAmount(Math.round(parseFloat(shares) * parseFloat(price)).toString());
    } else if (useTotal && totalAmount && shares) {
      setPrice((parseFloat(totalAmount) / parseFloat(shares)).toFixed(2));
    }
    setUseTotal(!useTotal);
  };

  const handlePriceChange = (value) => {
    setPrice(value);
    if (shares && value) {
      setTotalAmount((parseFloat(shares) * parseFloat(value)).toFixed(0));
    }
  };

  const formatTotalInput = (value) => {
    if (!value) return '';
    const digitsOnly = String(value).replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTotalInputChange = (value) => {
    const numericValue = value.replace(/\./g, '');
    setTotalAmount(numericValue);

    if (shares && numericValue) {
      setPrice((parseFloat(numericValue) / parseFloat(shares)).toFixed(2));
    }
  };

  const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
  const expectedProfit = shares && price ? (parseFloat(price) - avgBuy) * parseFloat(shares) : 0;
  const profitPercent = avgBuy > 0 && price ? ((parseFloat(price) - avgBuy) / avgBuy * 100) : 0;
  const calculatedTotal = !useTotal && shares && price ? (parseFloat(shares) * parseFloat(price)).toFixed(2) : null;

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
        Sell {stock.name}
      </h2>

      <div style={{
        padding: '0.75rem',
        background: 'rgba(251, 146, 60, 0.1)',
        border: '1px solid rgb(251, 146, 60)',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgb(251, 146, 60)', fontWeight: '600' }}>
            Available: {formatNumber(stock.shares)} shares
          </span>
          {shares && parseFloat(shares) > 0 && (
            <span style={{ fontSize: '0.875rem', color: 'rgb(156, 163, 175)', fontWeight: '500' }}>
              After: {formatNumber(stock.shares - parseFloat(shares))} shares
            </span>
          )}
        </div>
      </div>

      {/* Profit Calculator */}
      {shares && price && parseFloat(shares) > 0 && parseFloat(price) > 0 && (
        <div style={{
          padding: '0.75rem',
          background: expectedProfit >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: expectedProfit >= 0 ? '1px solid rgb(52, 211, 153)' : '1px solid rgb(248, 113, 113)',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
              Avg Buy Price:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
              ${avgBuy.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
              Sell Price:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
              ${parseFloat(price).toFixed(2)}
            </span>
          </div>
          {!useTotal && calculatedTotal && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
                Total Revenue:
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
                ${formatNumber(calculatedTotal)}
              </span>
            </div>
          )}
          <div style={{
            borderTop: '1px solid rgba(209, 213, 219, 0.2)',
            paddingTop: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'rgb(209, 213, 219)' }}>
                Expected Profit:
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: expectedProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'
              }}>
                {(expectedProfit >= 0 ? '+' : '') + formatNumber(expectedProfit)}
              </span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginTop: '0.25rem' }}>
              {(profitPercent >= 0 ? '+' : '') + profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              Shares (Max: {stock.shares?.toLocaleString()})
            </label>
            <button
              onClick={() => setShares(stock.shares.toString())}
              style={{
                padding: '0.25rem 0.75rem',
                background: 'rgb(185, 28, 28)',
                borderRadius: '0.375rem',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(153, 27, 27)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
            >
              ALL
            </button>
          </div>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Number of shares"
            max={stock.shares}
            min="0"
            step="1"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(239, 68, 68)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              {useTotal ? 'Total Revenue' : 'Price per Share'}
            </label>
            <button
              onClick={handleModeToggle}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'rgb(51, 65, 85)',
                borderRadius: '0.5rem',
                border: '1px solid rgb(71, 85, 105)',
                color: 'rgb(226, 232, 240)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgb(71, 85, 105)';
                e.currentTarget.style.borderColor = 'rgb(100, 116, 139)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgb(51, 65, 85)';
                e.currentTarget.style.borderColor = 'rgb(71, 85, 105)';
              }}
            >
              ⇄ {useTotal ? 'Price' : 'Total'}
            </button>
          </div>
          <input
            type={useTotal ? "text" : "number"}
            value={useTotal ? formatTotalInput(totalAmount) : price}
            onChange={(e) => useTotal ? handleTotalInputChange(e.target.value) : handlePriceChange(e.target.value)}
            placeholder={useTotal ? 'Total revenue' : 'Price per share'}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(239, 68, 68)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            disabled={!shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: (!shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 'rgb(100, 100, 100)'
                : 'rgb(185, 28, 28)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: (!shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 'not-allowed'
                : 'pointer',
              fontWeight: '500',
              opacity: (!shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0)
                ? 0.5
                : 1
            }}
            onMouseOver={(e) => {
              if (shares && parseFloat(shares) <= stock.shares && parseFloat(shares) > 0) {
                e.currentTarget.style.background = 'rgb(153, 27, 27)';
              }
            }}
            onMouseOut={(e) => {
              if (shares && parseFloat(shares) <= stock.shares && parseFloat(shares) > 0) {
                e.currentTarget.style.background = 'rgb(185, 28, 28)';
              }
            }}
          >
            Confirm
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