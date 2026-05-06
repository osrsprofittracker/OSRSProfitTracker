import React from 'react';
import '../../styles/confirm-modal.css';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="modal-container confirm-modal">
      <h2 className={`confirm-modal-title confirm-modal-title--${confirmVariant}`}>
        {title}
      </h2>
      <p className="confirm-modal-text">
        {message}
      </p>
      <div className="confirm-modal-actions">
        <button onClick={onConfirm} className={`btn btn-${confirmVariant}`}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
