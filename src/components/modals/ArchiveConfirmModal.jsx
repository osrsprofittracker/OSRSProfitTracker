import React from 'react';
import '../../styles/archive-modal.css';

export default function ArchiveConfirmModal({ stock, onConfirm, onCancel }) {
  return (
    <div className="modal-container archive-confirm-modal">
      <h2 className="archive-confirm-title">Archive Stock</h2>
      <p className="archive-confirm-text">
        Are you sure you want to archive <strong className="archive-confirm-name">{stock?.name}</strong>? It will be removed from your trade screen but can be restored anytime.
      </p>
      <div className="archive-confirm-actions">
        <button onClick={onConfirm} className="btn btn-warning">
          📦 Archive
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
