import React, { useState } from 'react';
import { CheckCircle, Undo2, AlertTriangle, Loader2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import '../../styles/bulk-summary-modal.css';

export default function BulkSummaryModal({ type, completedItems, onUndo, onDone, isUndoing, undoResult }) {
  const [confirmUndo, setConfirmUndo] = useState(false);
  const isBuy = type === 'buy';

  const totalGP = completedItems.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = isBuy ? null : completedItems.reduce((sum, item) => sum + (item.profit || 0), 0);

  const handleUndoClick = () => {
    if (!confirmUndo) {
      setConfirmUndo(true);
      return;
    }
    onUndo();
  };

  const undone = undoResult !== null;

  return (
    <div className="bulk-summary-modal">
      <div className="bulk-summary-header">
        <div className="bulk-summary-header-icon">
          {undone && !undoResult.success
            ? <AlertTriangle size={22} />
            : <CheckCircle size={22} />
          }
        </div>
        <div className="bulk-summary-header-text">
          <h2>
            {undone
              ? (undoResult.success ? 'Undo Complete' : 'Partial Undo')
              : `Bulk ${isBuy ? 'Buy' : 'Sell'} Complete`
            }
          </h2>
          <span className="bulk-summary-item-count">
            {completedItems.length} item{completedItems.length !== 1 ? 's' : ''} {isBuy ? 'purchased' : 'sold'}
          </span>
        </div>
      </div>

      <div className="bulk-summary-receipt">
        <div className={`bulk-summary-receipt-header ${!isBuy ? 'with-profit' : ''}`}>
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
          {!isBuy && <span>Profit</span>}
        </div>
        <div className="bulk-summary-lines">
          {completedItems.map((item, i) => (
            <div className={`bulk-summary-line ${!isBuy ? 'with-profit' : ''}`} key={i}>
              <span className="bulk-summary-line-name">{item.stockName}</span>
              <span className="bulk-summary-line-qty">{formatNumber(item.shares)}</span>
              <span className="bulk-summary-line-price">{formatNumber(item.price)}</span>
              <span className="bulk-summary-line-total">{formatNumber(item.total)}</span>
              {!isBuy && (
                <span className={`bulk-summary-line-profit ${item.profit >= 0 ? 'profit' : 'loss'}`}>
                  {item.profit >= 0 ? '+' : ''}{formatNumber(item.profit)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bulk-summary-totals">
        <div className="bulk-summary-totals-row">
          <span className="bulk-summary-totals-label">
            Total {isBuy ? 'Spent' : 'Received'}
          </span>
          <span className={`bulk-summary-totals-amount ${isBuy ? 'cost' : 'revenue'}`}>
            {formatNumber(totalGP)} GP
          </span>
        </div>
        {!isBuy && totalProfit !== null && (
          <div className="bulk-summary-totals-row">
            <span className="bulk-summary-totals-label">Total Profit</span>
            <span className={`bulk-summary-totals-amount ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
              {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit)} GP
            </span>
          </div>
        )}
      </div>

      {undone && undoResult.errors.length > 0 && (
        <div className="bulk-summary-undo-errors">
          {undoResult.errors.map((err, i) => (
            <div className="bulk-summary-undo-error" key={i}>
              <AlertTriangle size={13} />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bulk-summary-footer">
        {undone ? (
          <div className="bulk-summary-undo-result">
            <span className={undoResult.success ? 'undo-success' : 'undo-partial'}>
              {undoResult.success
                ? `All ${undoResult.undoneCount} transactions reversed`
                : `${undoResult.undoneCount} reversed, ${undoResult.failedCount} failed`
              }
            </span>
            <button className="bulk-summary-done-btn" onClick={onDone}>Close</button>
          </div>
        ) : (
          <div className="bulk-summary-actions">
            <button
              className={`bulk-summary-undo-btn ${confirmUndo ? 'confirm' : ''}`}
              onClick={handleUndoClick}
              disabled={isUndoing}
            >
              {isUndoing ? (
                <><Loader2 size={14} className="bulk-summary-spinner" /> Undoing...</>
              ) : confirmUndo ? (
                <><Undo2 size={14} /> Are you sure?</>
              ) : (
                <><Undo2 size={14} /> Undo All</>
              )}
            </button>
            <button className="bulk-summary-done-btn" onClick={onDone} disabled={isUndoing}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
