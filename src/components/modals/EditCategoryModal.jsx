import React, { useState } from 'react';

export default function EditCategoryModal({ category, categories, onConfirm, onCancel }) {
  const [newName, setNewName] = useState(category);

  const handleConfirm = () => {
    if (!newName.trim()) {
      alert('Category name cannot be empty');
      return;
    }
    if (newName !== category && categories.includes(newName)) {
      alert('Category already exists');
      return;
    }
    onConfirm(newName.trim());
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
        Edit Category
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Category Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new category name"
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              background: 'rgb(51, 65, 85)',
              borderRadius: '0.5rem',
              outline: 'none',
              border: '2px solid transparent',
              color: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgb(147, 51, 234)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'rgb(147, 51, 234)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}