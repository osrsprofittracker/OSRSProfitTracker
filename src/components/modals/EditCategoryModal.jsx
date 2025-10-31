import React, { useState } from 'react';

export default function EditCategoryModal({ category, categories, onConfirm, onCancel }) {
  const [newName, setNewName] = useState(category);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName && newName !== category) {
      onConfirm(category, newName);
    }
  };

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '28rem'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Edit Category
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '1rem',
            background: 'rgb(51, 65, 85)',
            border: 'none',
            borderRadius: '0.375rem',
            color: 'white'
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              background: 'rgb(59, 130, 246)',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}