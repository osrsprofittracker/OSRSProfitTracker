import React, { useState } from 'react';
import { Bell, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export default function PriceAlertModal({ itemId, itemName, currentAlert, gePrice, onSave, onDelete, onCancel }) {
  const [highThreshold, setHighThreshold] = useState(
    currentAlert?.highThreshold ? String(currentAlert.highThreshold) : ''
  );
  const [lowThreshold, setLowThreshold] = useState(
    currentAlert?.lowThreshold ? String(currentAlert.lowThreshold) : ''
  );
  const [error, setError] = useState('');

  const isEditing = !!currentAlert?.isActive;

  const handleSave = () => {
    const high = highThreshold ? parseInt(highThreshold, 10) : null;
    const low = lowThreshold ? parseInt(lowThreshold, 10) : null;

    if (!high && !low) {
      setError('Set at least one price threshold');
      return;
    }
    if (high !== null && (isNaN(high) || high <= 0)) {
      setError('High threshold must be a positive number');
      return;
    }
    if (low !== null && (isNaN(low) || low <= 0)) {
      setError('Low threshold must be a positive number');
      return;
    }

    onSave(itemId, itemName, high, low);
  };

  const currentHigh = gePrice?.high;
  const currentLow = gePrice?.low;

  return (
    <div className="modal-container">
      <div className="price-alert-modal-header">
        <Bell size={20} className="price-alert-modal-icon" />
        <h2 className="price-alert-modal-title">
          {isEditing ? 'Edit Price Alert' : 'Set Price Alert'}
        </h2>
      </div>

      <div className="price-alert-modal-item-name">{itemName}</div>

      {(currentHigh != null || currentLow != null) && (
        <div className="price-alert-current-prices">
          {currentHigh != null && (
            <div className="price-alert-current-price">
              <span className="price-alert-current-label">GE High</span>
              <span className="price-alert-current-value">{formatNumber(currentHigh, 'full')}</span>
            </div>
          )}
          {currentLow != null && (
            <div className="price-alert-current-price">
              <span className="price-alert-current-label">GE Low</span>
              <span className="price-alert-current-value">{formatNumber(currentLow, 'full')}</span>
            </div>
          )}
        </div>
      )}

      <div className="price-alert-modal-fields">
        <div className="price-alert-field">
          <label className="price-alert-field-label">
            <TrendingUp size={14} className="price-alert-field-icon-up" />
            Notify when price above
          </label>
          <input
            type="number"
            className="price-alert-input"
            value={highThreshold}
            onChange={(e) => { setHighThreshold(e.target.value); setError(''); }}
            placeholder="e.g. 5000000"
            min="1"
          />
        </div>

        <div className="price-alert-field">
          <label className="price-alert-field-label">
            <TrendingDown size={14} className="price-alert-field-icon-down" />
            Notify when price below
          </label>
          <input
            type="number"
            className="price-alert-input"
            value={lowThreshold}
            onChange={(e) => { setLowThreshold(e.target.value); setError(''); }}
            placeholder="e.g. 3000000"
            min="1"
          />
        </div>
      </div>

      {error && <div className="price-alert-error">{error}</div>}

      <div className="price-alert-modal-actions">
        {isEditing && (
          <button
            className="price-alert-btn-delete"
            onClick={() => onDelete(currentAlert.id)}
            title="Delete alert"
          >
            <Trash2 size={14} />
          </button>
        )}
        <div className="price-alert-modal-actions-right">
          <button className="btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-modal-confirm" onClick={handleSave}>
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
