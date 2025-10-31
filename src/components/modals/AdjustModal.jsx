import React, { useState } from 'react';

export default function AdjustModal({ stock, categories, onConfirm, onCancel }) {
  const [name, setName] = useState(stock.name);
  const [needed, setNeeded] = useState(stock.needed.toString());
  const [category, setCategory] = useState(stock.category || 'Uncategorized');
  const [limit4h, setLimit4h] = useState(stock.limit4h.toString());

  const handleConfirm = () => {
    if (!needed || !name.trim() || !limit4h) return;  // Update validation
    onConfirm({
      name: name.trim(),
      needed: parseFloat(needed),
      category,
      limit4h: parseFloat(limit4h)
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
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Uncategorized">Uncategorized</option>
          </select>
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