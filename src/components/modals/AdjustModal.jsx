import React, { useState } from 'react';

export default function AdjustModal({ stock, categories, onConfirm, onCancel }) {
  const [name, setName] = useState(stock.name);
  const [needed, setNeeded] = useState(stock.needed.toString());
  const [category, setCategory] = useState(stock.category || 'Uncategorized');
  const [limit4h, setLimit4h] = useState(stock.limit4h.toString());
  const [onHold, setOnHold] = useState(stock.onHold || false);
  const [isInvestment, setIsInvestment] = useState(stock.isInvestment || false);
  const [targetCategory, setTargetCategory] = useState('Uncategorized');

  const modeChanged = isInvestment !== (stock.isInvestment || false);
  const targetCategories = categories.filter(c => c.isInvestment === isInvestment).map(c => c.name);
  const currentCategories = categories.filter(c => c.isInvestment === (stock.isInvestment || false)).map(c => c.name);

  const handleConfirm = () => {
    if (!needed || !name.trim() || !limit4h) return;
    onConfirm({
      name: name.trim(),
      needed: parseFloat(needed),
      category: modeChanged ? targetCategory : category,
      limit4h: parseFloat(limit4h),
      onHold,
      isInvestment
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
        Adjust {stock.name}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Stock Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter stock name"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            4H Limit
          </label>
          <input
            type="number"
            value={limit4h}
            onChange={(e) => setLimit4h(e.target.value)}
            placeholder="Enter 4h limit"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Desired Stock
          </label>
          <input
            type="number"
            value={needed}
            onChange={(e) => setNeeded(e.target.value)}
            placeholder="Enter new needed value"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            {modeChanged ? 'Target Category' : 'Category'}
          </label>
          <select
            value={modeChanged ? targetCategory : category}
            onChange={(e) => modeChanged ? setTargetCategory(e.target.value) : setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          >
            {(modeChanged ? targetCategories : currentCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <label className="checkbox-investment">
          <input
            type="checkbox"
            checked={isInvestment}
            onChange={(e) => setIsInvestment(e.target.checked)}
            className="checkbox-input"
          />
          <span className="checkbox-investment-text">📈 Mark as Investment</span>
        </label>
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem'
          }}>
            <input
              type="checkbox"
              checked={onHold}
              onChange={(e) => setOnHold(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              🔒 Put on hold (don't buy this stock)
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(202, 138, 4)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(202, 138, 4)'}
          >
            Save
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