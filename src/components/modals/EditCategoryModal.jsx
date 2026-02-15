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
    <div className="modal-container">
      <h2 className="modal-title">Edit Category</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="form-input"
          autoFocus
        />
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-modal-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-modal-confirm">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}