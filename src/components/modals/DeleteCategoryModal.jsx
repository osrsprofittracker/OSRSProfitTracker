import React from 'react';

export default function DeleteCategoryModal({ category, onConfirm, onCancel }) {
  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'rgb(248, 113, 113)' }}>
        Delete Category
      </h2>
      <p style={{ color: 'rgb(209, 213, 219)', marginBottom: '1.5rem' }}>
        Are you sure you want to delete the <span style={{ fontWeight: 'bold', color: 'white' }}>{category}</span> category?
        All stocks in this category will be moved to "Uncategorized".
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => onConfirm(category)}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            background: 'rgb(220, 38, 38)',
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgb(220, 38, 38)'}
        >
          Delete Category
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
  );
}