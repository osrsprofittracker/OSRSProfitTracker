import React, { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import ItemIcon from '../ItemIcon';
import { NON_GE_CATALOG } from '../../data/nonGeCatalog';
import { calculateProfit } from '../../utils/calculations';
import { formatNumber } from '../../utils/formatters';
import {
  getNonGEItemImageUrl,
  normalizeNonGESearch,
  nonGEItemRangeLabel,
} from '../../utils/nonGeCatalog';

function catalogOption(item) {
  return {
    type: 'catalog',
    id: item.key,
    key: `catalog:${item.key}`,
    name: item.name,
    rangeLabel: nonGEItemRangeLabel(item),
    category: item.category || 'Uncategorized',
    imageUrl: getNonGEItemImageUrl(item),
    catalogItemKey: item.key,
    customItemId: null,
  };
}

function customOption(item) {
  return {
    type: 'custom',
    id: item.id,
    key: `custom:${item.id}`,
    name: item.name,
    rangeLabel: item.rangeLabel || 'Unknown',
    category: 'Custom',
    imageUrl: getNonGEItemImageUrl(item),
    catalogItemKey: null,
    customItemId: item.id,
  };
}

export default function MoveToNonGEModal({
  stock,
  categories,
  customItems,
  existingStocks,
  stockNote,
  transactionCount,
  summaryLoading = false,
  moveError = '',
  isSubmitting = false,
  onConfirm,
  onCreateCustomItem,
  onCancel,
}) {
  const [query, setQuery] = useState(stock?.name || '');
  const [selectedItem, setSelectedItem] = useState(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState(stock?.name || '');
  const [customRangeLabel, setCustomRangeLabel] = useState('Unknown');
  const [customWikiUrl, setCustomWikiUrl] = useState('');
  const [customError, setCustomError] = useState('');

  const categoryIdByName = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.name.toLowerCase()] = category.id;
      return acc;
    }, {});
  }, [categories]);

  const existingKeys = useMemo(() => new Set(
    existingStocks
      .map(item => item.catalogItemKey ? `catalog:${item.catalogItemKey}` : `custom:${item.customItemId}`)
      .filter(Boolean)
  ), [existingStocks]);

  const options = useMemo(() => {
    const normalized = normalizeNonGESearch(query);
    const allOptions = [
      ...NON_GE_CATALOG.map(catalogOption),
      ...customItems.map(customOption),
    ];

    return allOptions
      .filter(item => !normalized || item.name.toLowerCase().includes(normalized))
      .slice(0, 80);
  }, [customItems, query]);

  const duplicateSelected = Boolean(selectedItem?.key && existingKeys.has(selectedItem.key));
  const canConfirm = Boolean(selectedItem && categoryId && !duplicateSelected && !isSubmitting);
  const realizedProfit = calculateProfit(stock || {});
  const hasNotes = Boolean(String(stockNote || '').trim());

  const handleConfirm = () => {
    if (!canConfirm) return;

    onConfirm({
      catalogItemKey: selectedItem.catalogItemKey,
      customItemId: selectedItem.customItemId,
      nameSnapshot: selectedItem.name,
      categoryId,
      targetBuyPrice: null,
      targetSellPrice: null,
    });
  };

  const selectCustomItem = (item) => {
    const option = customOption(item);
    setSelectedItem(option);
    setQuery(option.name);
    setShowCustomForm(false);
    setCustomError('');
  };

  const handleCreateCustom = async () => {
    const name = customName.trim();
    if (!name) {
      setCustomError('Custom item name is required.');
      return;
    }

    const existingCustomItem = customItems.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existingCustomItem) {
      selectCustomItem(existingCustomItem);
      return;
    }

    const duplicateTrackedCustom = existingStocks.some(item =>
      !item.catalogItemKey && item.nameSnapshot?.toLowerCase() === name.toLowerCase()
    );
    if (duplicateTrackedCustom) {
      setCustomError(`${name} is already tracked in Non-GE.`);
      return;
    }

    const created = await onCreateCustomItem?.({
      name,
      wikiUrl: customWikiUrl.trim(),
      sourceName: 'Custom',
      rangeLabel: customRangeLabel.trim() || 'Unknown',
    });

    if (!created) {
      setCustomError('Could not create custom item.');
      return;
    }

    selectCustomItem(created);
    setCustomName(created.name);
    setCustomRangeLabel('Unknown');
    setCustomWikiUrl('');
  };

  if (!stock) return null;

  return (
    <div className="modal-container non-ge-modal non-ge-adjust-modal">
      <div className="non-ge-modal-header">
        <h2 className="modal-title">Move to Non-GE</h2>
      </div>

      <div className="non-ge-move-source">
        <span>Source GE item</span>
        <strong>{stock.name}</strong>
      </div>

      <label className="non-ge-field">
        <span>Non-GE item</span>
        <div className="non-ge-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Non-GE item"
            className="non-ge-input"
          />
        </div>
      </label>

      <button
        type="button"
        className="non-ge-custom-toggle"
        onClick={() => {
          setShowCustomForm(prev => !prev);
          setCustomName(stock.name || '');
          setCustomRangeLabel('Unknown');
          setCustomWikiUrl('');
          setCustomError('');
        }}
      >
        <Plus size={14} />
        Custom item
      </button>

      {showCustomForm && (
        <div className="non-ge-custom-panel">
          <label className="non-ge-field">
            <span>Name</span>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Custom item name"
              className="non-ge-input"
            />
          </label>
          <label className="non-ge-field">
            <span>Range</span>
            <input
              type="text"
              value={customRangeLabel}
              onChange={(event) => setCustomRangeLabel(event.target.value)}
              placeholder="Unknown"
              className="non-ge-input"
            />
          </label>
          <label className="non-ge-field">
            <span>Wiki URL</span>
            <input
              type="url"
              value={customWikiUrl}
              onChange={(event) => setCustomWikiUrl(event.target.value)}
              placeholder="Optional"
              className="non-ge-input"
            />
          </label>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateCustom}>
            Create Custom Item
          </button>
          {customError && <div className="non-ge-modal-error">{customError}</div>}
        </div>
      )}

      {!showCustomForm && <div className="non-ge-option-list non-ge-adjust-option-list">
        {options.map(item => {
          const isSelected = selectedItem?.key === item.key;
          const isDuplicate = existingKeys.has(item.key);

          return (
            <button
              key={item.key}
              type="button"
              className={`non-ge-option-row${isSelected ? ' is-selected' : ''}${isDuplicate ? ' is-disabled' : ''}`}
              onClick={() => {
                setSelectedItem(item);
                setQuery(item.name);
                setCategoryId(categoryIdByName[item.category.toLowerCase()] || categoryId || categories[0]?.id || '');
              }}
            >
              <ItemIcon
                src={item.imageUrl}
                alt=""
                className="non-ge-option-icon"
                fallbackText={item.name}
              />
              <span className="non-ge-option-text">
                <strong>{item.name}</strong>
                <small>{item.category} - {item.rangeLabel}</small>
              </span>
              {isDuplicate && <em>Already tracked</em>}
            </button>
          );
        })}
      </div>}

      <label className="non-ge-field non-ge-move-category-field">
        <span>Non-GE category</span>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="non-ge-input">
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>

      <div className="non-ge-adjust-locked">
        <div>
          <span>Held Qty</span>
          <strong>{formatNumber(stock.shares, 'full')}</strong>
        </div>
        <div>
          <span>Sold Qty</span>
          <strong>{formatNumber(stock.sharesSold, 'full')}</strong>
        </div>
        <div>
          <span>Total Cost</span>
          <strong>{formatNumber(stock.totalCost, 'full')}</strong>
        </div>
        <div>
          <span>Realized Profit</span>
          <strong>{realizedProfit >= 0 ? '+' : ''}{formatNumber(realizedProfit, 'full')}</strong>
        </div>
        <div>
          <span>Notes</span>
          <strong>{hasNotes ? 'Yes' : 'No'}</strong>
        </div>
        <div>
          <span>Transactions</span>
          <strong>{summaryLoading ? 'Loading' : formatNumber(transactionCount || 0, 'full')}</strong>
        </div>
      </div>

      <div className="non-ge-modal-warning">
        <AlertTriangle size={16} />
        <span>The old GE stock row will be deleted after history is relinked to the new Non-GE item.</span>
      </div>
      {duplicateSelected && (
        <div className="non-ge-modal-error">That destination item is already tracked in Non-GE.</div>
      )}
      {moveError && <div className="non-ge-modal-error">{moveError}</div>}

      <div className="modal-actions">
        <button type="button" className="btn-modal-cancel" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="button" className="btn-modal-confirm" onClick={handleConfirm} disabled={!canConfirm}>
          {isSubmitting ? 'Moving...' : 'Move to Non-GE'}
        </button>
      </div>
    </div>
  );
}
