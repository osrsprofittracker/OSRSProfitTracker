import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatters';

export default function BuyModal({ stock, onConfirm, onCancel }) {
  const [shares, setShares] = useState((stock.limit4h * 1).toString());
  const [price, setPrice] = useState('');
  const [startTimer, setStartTimer] = useState(true);
  const [multiplier, setMultiplier] = useState(1);
  const [useTotal, setUseTotal] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');

  React.useEffect(() => {
    const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
    const avgPrice = (Math.round(avgBuy * 100) / 100).toFixed(0);
    setPrice(avgPrice);
    setTotalAmount((stock.limit4h * parseFloat(avgPrice)).toFixed(0));
  }, [stock]);

  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
    const newShares = stock.limit4h * mult;
    setShares(newShares.toString());

    if (price) {
      setTotalAmount((newShares * parseFloat(price)).toFixed(0));
    }
  };

  const handleModeToggle = () => {
    if (!useTotal && price && shares) {
      // Switching TO total mode - calculate total from current price
      setTotalAmount(Math.round(parseFloat(shares) * parseFloat(price)).toString());
    } else if (useTotal && totalAmount && shares) {
      // Switching TO price mode - calculate price from current total
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

  const handleTotalChange = (value) => {
    setTotalAmount(value);
    if (shares && value) {
      setPrice((parseFloat(value) / parseFloat(shares)).toFixed(0));
    }
  };

  const formatTotalInput = (value) => {
    if (!value) return '';
    // Convert to string and remove all non-digit characters
    const digitsOnly = String(value).replace(/\D/g, '');
    if (!digitsOnly) return '';

    // Add thousand separators with dots
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTotalInputChange = (value) => {
    const formatted = formatTotalInput(value);
    const numericValue = value.replace(/\./g, '');
    setTotalAmount(numericValue);

    if (shares && numericValue) {
      setPrice((parseFloat(numericValue) / parseFloat(shares)).toFixed(2));
    }
  };

  const handleConfirm = () => {
    if (useTotal) {
      if (!shares || !totalAmount) return;
      const calculatedPrice = parseFloat(totalAmount) / parseFloat(shares);
      onConfirm({
        shares: parseFloat(shares),
        price: calculatedPrice,
        startTimer
      });
    } else {
      if (!shares || !price) return;
      onConfirm({
        shares: parseFloat(shares),
        price: parseFloat(price),
        startTimer
      });
    }
  };

  const calculatedTotal = !useTotal && shares && price ? (parseFloat(shares) * parseFloat(price)).toFixed(2) : null;
  const calculatedAvg = useTotal && shares && totalAmount ? (parseFloat(totalAmount) / parseFloat(shares)).toFixed(2) : null;

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
        Buy {stock.name}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Shares
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(mult => (
              <button
                key={mult}
                onClick={() => handleMultiplierChange(mult)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: multiplier === mult ? 'rgb(34, 197, 94)' : 'rgb(71, 85, 105)',
                  borderRadius: '0.5rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (multiplier !== mult) e.currentTarget.style.background = 'rgb(51, 65, 85)';
                }}
                onMouseOut={(e) => {
                  if (multiplier !== mult) e.currentTarget.style.background = 'rgb(71, 85, 105)';
                }}
              >
                {mult}x
              </button>
            ))}
          </div>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Number of shares"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(34, 197, 94)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              {useTotal ? 'Total Cost' : 'Price per Share'}
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
            placeholder={useTotal ? 'Total cost' : 'Price per share'}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(34, 197, 94)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
          {useTotal && price && (
            <div style={{
              background: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgb(251, 146, 60)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.25rem', color: 'rgb(251, 146, 60)' }}>Avg: </span>
              <span style={{ fontSize: '1.25rem', color: 'rgb(251, 146, 60)', fontWeight: '500' }}>${price}</span>
            </div>
          )}
          {!useTotal && calculatedTotal && (
            <div style={{
              background: 'rgba(234, 88, 12, 0.1)',
              border: '1px solid rgb(251, 146, 60)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.25rem', color: 'rgb(251, 146, 60)' }}>Total: </span>
              <span style={{ fontSize: '1.25rem', color: 'rgb(251, 146, 60)', fontWeight: '500' }}>${formatNumber(parseFloat(calculatedTotal), 'full')}</span>
            </div>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={startTimer}
            onChange={(e) => setStartTimer(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>Start timer after purchase</span>
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(21, 128, 61)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
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