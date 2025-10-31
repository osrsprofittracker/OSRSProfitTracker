import React, { useState } from 'react';

export default function CategoryModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('');

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name);
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Category</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            outline: 'none',
            border: '2px solid transparent',
            color: 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgb(79, 70, 229)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              background: 'rgb(79, 70, 229)',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(79, 70, 229)'}
          >
            Add
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