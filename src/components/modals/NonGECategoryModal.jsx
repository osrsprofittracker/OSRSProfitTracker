import React, { useMemo, useState } from 'react';

export default function NonGECategoryModal({ categories = [], onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const trimmedName = name.trim();

  const duplicateName = useMemo(() => {
    const normalizedName = trimmedName.toLowerCase();
    if (!normalizedName) return false;
    return categories.some(category => category.name.toLowerCase() === normalizedName);
  }, [categories, trimmedName]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!trimmedName || duplicateName) return;
    onConfirm(trimmedName);
  };

  return (
    <div className="modal-container non-ge-category-modal">
      <h2 className="modal-title">Add Non-GE Category</h2>
      <form onSubmit={handleSubmit}>
        <label className="non-ge-field">
          Category name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="non-ge-input"
            autoFocus
          />
        </label>
        {duplicateName && (
          <div className="non-ge-modal-warning">A Non-GE category with that name already exists.</div>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-modal-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-modal-confirm" disabled={!trimmedName || duplicateName}>
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
