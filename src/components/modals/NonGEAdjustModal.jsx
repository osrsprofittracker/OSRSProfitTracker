import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ItemIcon from '../ItemIcon';
import { NON_GE_CATALOG } from '../../data/nonGeCatalog';
import { formatNumber, parseMK } from '../../utils/formatters';
import {
  getNonGECatalogItem,
  getNonGEItemImageUrl,
  normalizeNonGESearch,
  nonGEItemDisplayName,
  nonGEItemRangeLabel,
} from '../../utils/nonGeCatalog';

function parseOptionalNumber(value) {
  if (!String(value || '').trim()) return null;
  const parsed = Number(parseMK(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function catalogOption(item) {
  return {
    type: 'catalog',
    id: item.key,
    key: `catalog:${item.key}`,
    name: item.name,
    catalogItemKey: item.key,
    customItemId: null,
    rangeLabel: nonGEItemRangeLabel(item),
    sourceLabel: `${item.category || 'Catalog'} - ${item.sourceName || 'Catalog'}`,
    imageUrl: getNonGEItemImageUrl(item),
  };
}

function customOption(item) {
  return {
    type: 'custom',
    id: item.id,
    key: `custom:${item.id}`,
    name: item.name,
    catalogItemKey: null,
    customItemId: item.id,
    rangeLabel: item.rangeLabel || 'Unknown',
    sourceLabel: item.sourceName || 'Custom',
    imageUrl: getNonGEItemImageUrl(item),
  };
}

function fallbackOption(stock) {
  return {
    type: stock.catalogItemKey ? 'catalog' : 'custom',
    id: stock.catalogItemKey || stock.customItemId || stock.id,
    key: stock.catalogItemKey ? `catalog:${stock.catalogItemKey}` : `custom:${stock.customItemId || stock.id}`,
    name: nonGEItemDisplayName(stock),
    catalogItemKey: stock.catalogItemKey || null,
    customItemId: stock.customItemId || null,
    rangeLabel: 'Unknown',
    sourceLabel: 'Current item',
    imageUrl: stock.imageUrl || '',
  };
}

export default function NonGEAdjustModal({
  stock,
  categories,
  customItems,
  existingStocks,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) {
  const currentCatalogItem = getNonGECatalogItem(stock?.catalogItemKey);
  const currentCustomItem = customItems.find(item => item.id === stock?.customItemId);
  const initialOption = currentCatalogItem
    ? catalogOption(currentCatalogItem)
    : currentCustomItem
      ? customOption(currentCustomItem)
      : fallbackOption(stock);

  const [query, setQuery] = useState(initialOption.name);
  const [selectedItem, setSelectedItem] = useState(initialOption);
  const [categoryId, setCategoryId] = useState(stock.categoryId || categories[0]?.id || '');
  const [targetBuyPrice, setTargetBuyPrice] = useState(stock.targetBuyPrice == null ? '' : String(stock.targetBuyPrice));
  const [targetSellPrice, setTargetSellPrice] = useState(stock.targetSellPrice == null ? '' : String(stock.targetSellPrice));
  const [error, setError] = useState('');

  const existingKeys = useMemo(() => new Set(
    existingStocks
      .filter(item => item.id !== stock.id)
      .map(item => item.catalogItemKey ? `catalog:${item.catalogItemKey}` : `custom:${item.customItemId}`)
      .filter(Boolean)
  ), [existingStocks, stock.id]);

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
  const canConfirm = selectedItem && categoryId && !duplicateSelected && !isSubmitting;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const buyPrice = parseOptionalNumber(targetBuyPrice);
    const sellPrice = parseOptionalNumber(targetSellPrice);

    if ((targetBuyPrice && buyPrice == null) || (targetSellPrice && sellPrice == null)) {
      setError('Target prices must be valid numbers.');
      return;
    }

    onConfirm({
      catalogItemKey: selectedItem.catalogItemKey,
      customItemId: selectedItem.customItemId,
      nameSnapshot: selectedItem.name,
      categoryId,
      targetBuyPrice: buyPrice,
      targetSellPrice: sellPrice,
    });
  };

  return (
    <div className="modal-container non-ge-modal non-ge-adjust-modal">
      <div className="non-ge-modal-header">
        <h2 className="modal-title">Adjust Non-GE Item</h2>
      </div>

      <div className="non-ge-adjust-locked">
        <div>
          <span>Held Qty</span>
          <strong>{formatNumber(stock.shares, 'full')}</strong>
        </div>
        <div>
          <span>Total Cost</span>
          <strong>{formatNumber(stock.totalCost, 'full')}</strong>
        </div>
        <div>
          <span>Qty Sold</span>
          <strong>{formatNumber(stock.sharesSold, 'full')}</strong>
        </div>
        <div>
          <span>Total Sold</span>
          <strong>{formatNumber(stock.totalCostSold, 'full')}</strong>
        </div>
      </div>

      <label className="non-ge-field">
        <span>Catalog or custom identity</span>
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

      <div className="non-ge-option-list non-ge-adjust-option-list">
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
                setError('');
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
                <small>{item.sourceLabel} - {item.rangeLabel}</small>
              </span>
              {isDuplicate && <em>Already added</em>}
            </button>
          );
        })}
      </div>

      <div className="non-ge-modal-grid">
        <label className="non-ge-field">
          <span>Category</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="non-ge-input">
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="non-ge-field">
          <span>Target Buy</span>
          <input
            type="text"
            value={targetBuyPrice}
            onChange={(event) => setTargetBuyPrice(event.target.value)}
            placeholder="Optional"
            className="non-ge-input"
          />
        </label>
        <label className="non-ge-field">
          <span>Target Sell</span>
          <input
            type="text"
            value={targetSellPrice}
            onChange={(event) => setTargetSellPrice(event.target.value)}
            placeholder="Optional"
            className="non-ge-input"
          />
        </label>
      </div>

      {duplicateSelected && (
        <div className="non-ge-modal-warning">That item is already tracked. Choose another identity or restore the archived item.</div>
      )}
      {error && <div className="non-ge-modal-error">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn-modal-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-modal-confirm" onClick={handleConfirm} disabled={!canConfirm}>
          Save
        </button>
      </div>
    </div>
  );
}
