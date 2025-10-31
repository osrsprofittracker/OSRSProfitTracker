import React, { useState } from 'react';

export default function BuyModal({ stock, onConfirm, onCancel }) {
  const [shares, setShares] = useState((stock.limit4h * 1).toString());
  const [price, setPrice] = useState('');
  const [startTimer, setStartTimer] = useState(true);
  const [multiplier, setMultiplier] = useState(1);

  React.useEffect(() => {
    const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
    setPrice((Math.round(avgBuy * 100) / 100).toFixed(0));
  }, [stock]);

  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
    setShares((stock.limit4h * mult).toString());
  };

  const handleConfirm = () => {
    if (!shares || !price) return;
    onConfirm({
      shares: parseFloat(shares),
      price: parseFloat(price),
      startTimer
    });
  };

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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Price per Share
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
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