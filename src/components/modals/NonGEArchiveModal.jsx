import React from 'react';
import ItemIcon from '../ItemIcon';
import { getNonGECatalogItem, nonGEItemDisplayName } from '../../utils/nonGeCatalog';

export default function NonGEArchiveModal({ archivedStocks, loading, onRestore, onClose }) {
  return (
    <div className="modal-container non-ge-modal non-ge-archive-modal">
      <div className="non-ge-modal-header non-ge-archive-header">
        <h2 className="modal-title">Non-GE Archive</h2>
        <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
      </div>

      {loading ? (
        <p className="non-ge-modal-empty">Loading...</p>
      ) : archivedStocks.length === 0 ? (
        <p className="non-ge-modal-empty">No archived Non-GE items.</p>
      ) : (
        <div className="non-ge-archive-list">
          {archivedStocks.map(stock => {
            const catalogItem = getNonGECatalogItem(stock.catalogItemKey);
            const name = nonGEItemDisplayName(stock);

            return (
              <div key={stock.id} className="non-ge-archive-item">
                <div className="non-ge-archive-info">
                  <ItemIcon
                    src={catalogItem?.imageUrl}
                    alt=""
                    className="non-ge-item-icon"
                    fallbackText={name}
                  />
                  <div>
                    <div className="non-ge-archive-name">{name}</div>
                    <div className="non-ge-archive-meta">{catalogItem?.category || 'Custom'} · {catalogItem?.rangeLabel || 'Unknown'}</div>
                  </div>
                </div>
                <button type="button" onClick={() => onRestore(stock)} className="btn btn-success btn-sm">
                  Restore
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
