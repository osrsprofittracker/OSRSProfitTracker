import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ItemIcon from '../ItemIcon';
import { NON_GE_CATALOG } from '../../data/nonGeCatalog';
import { getNonGEWikiImageUrl, normalizeNonGESearch, nonGEItemRangeLabel } from '../../utils/nonGeCatalog';

export default function NonGEBulkAddModal({
  categories,
  existingStocks,
  onConfirm,
  onCancel,
}) {
  const [query, setQuery] = useState('');
  const [categoryId] = useState(categories[0]?.id || '');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [resultMessage, setResultMessage] = useState('');

  const categoryIdByName = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.name.toLowerCase()] = category.id;
      return acc;
    }, {});
  }, [categories]);

  const uncategorizedId = categoryIdByName.uncategorized || categoryId || categories[0]?.id || '';

  const existingKeys = useMemo(() => new Set(
    existingStocks
      .filter(stock => stock.catalogItemKey)
      .map(stock => stock.catalogItemKey)
  ), [existingStocks]);

  const filteredItems = useMemo(() => {
    const normalized = normalizeNonGESearch(query);
    const items = normalized
      ? NON_GE_CATALOG.filter(item => item.name.toLowerCase().includes(normalized))
      : NON_GE_CATALOG;
    return items.slice(0, 120);
  }, [query]);

  const toggleItem = (itemKey) => {
    setResultMessage('');
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const selectedItems = NON_GE_CATALOG.filter(item => selectedKeys.has(item.key));
    const result = await onConfirm({
      items: selectedItems.map(item => ({
        catalogItemKey: item.key,
        customItemId: null,
        nameSnapshot: item.name,
        categoryId: categoryIdByName[item.category.toLowerCase()] || uncategorizedId,
        targetBuyPrice: null,
        targetSellPrice: null,
      })),
    });

    if (result?.skipped > 0) {
      setResultMessage(`Added ${result.added} item(s). Skipped ${result.skipped} duplicate item(s).`);
      setSelectedKeys(new Set());
      return;
    }

    onCancel();
  };

  return (
    <div className="modal-container non-ge-modal non-ge-bulk-modal">
      <div className="non-ge-modal-header">
        <h2 className="modal-title">Bulk Add Non-GE Items</h2>
      </div>

      <div className="non-ge-bulk-toolbar non-ge-bulk-toolbar--single">
        <label className="non-ge-field">
          <span>Search</span>
          <div className="non-ge-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search item name"
              className="non-ge-input"
            />
          </div>
        </label>
      </div>

      <div className="non-ge-bulk-list">
        {filteredItems.map(item => {
          const isDuplicate = existingKeys.has(item.key);
          const checked = selectedKeys.has(item.key);

          return (
            <label key={item.key} className={`non-ge-bulk-row${isDuplicate ? ' is-disabled' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={isDuplicate}
                onChange={() => toggleItem(item.key)}
              />
              <ItemIcon
                src={getNonGEWikiImageUrl(item)}
                alt=""
                className="non-ge-option-icon"
                fallbackText={item.name}
              />
              <span className="non-ge-option-text">
                <strong>{item.name}</strong>
                <small>{item.category} · {nonGEItemRangeLabel(item)}</small>
              </span>
              {isDuplicate && <em>Already added</em>}
            </label>
          );
        })}
      </div>

      {resultMessage && <div className="non-ge-modal-warning">{resultMessage}</div>}

      <div className="modal-actions">
        <button type="button" className="btn-modal-cancel" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="btn-modal-confirm"
          onClick={handleConfirm}
          disabled={selectedKeys.size === 0}
        >
          Add Selected ({selectedKeys.size})
        </button>
      </div>
    </div>
  );
}
