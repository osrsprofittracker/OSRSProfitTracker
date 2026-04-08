import React from 'react';
import '../../styles/archive-modal.css';

export default function ArchiveModal({ archivedStocks, loading, geIconMap, onRestore, onClose }) {
  return (
    <div className="modal-container archive-modal">
      <div className="archive-modal-header">
        <h2 className="archive-modal-title">📦 Archive</h2>
        <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
      </div>
      {loading ? (
        <p className="archive-modal-empty">Loading...</p>
      ) : archivedStocks.length === 0 ? (
        <p className="archive-modal-empty">No archived stocks.</p>
      ) : (
        <div className="archive-modal-list">
          {archivedStocks.map(stock => (
            <div key={stock.id} className="archive-modal-item">
              <div className="archive-modal-item-info">
                {stock.itemId && geIconMap[stock.itemId] && (
                  <img src={geIconMap[stock.itemId]} alt="" className="archive-modal-item-icon" />
                )}
                <div>
                  <div className="archive-modal-item-name">{stock.name}</div>
                  <div className="archive-modal-item-meta">
                    {stock.isInvestment ? '📈 Investment' : '💼 Trade'} · {stock.category}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRestore(stock)}
                className="btn btn-success btn-sm"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
