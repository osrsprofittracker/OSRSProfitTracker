import React, { useMemo, useState } from 'react';
import { Image, Plus, Search } from 'lucide-react';
import ItemIcon from '../ItemIcon';
import { NON_GE_CATALOG } from '../../data/nonGeCatalog';
import { normalizeNonGESearch, nonGEItemRangeLabel } from '../../utils/nonGeCatalog';
import { parseMK } from '../../utils/formatters';

function parseOptionalNumber(value) {
  if (!String(value || '').trim()) return null;
  const parsed = Number(parseMK(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function catalogOption(item) {
  return {
    type: 'catalog',
    id: item.key,
    name: item.name,
    rangeLabel: nonGEItemRangeLabel(item),
    category: item.category || 'Uncategorized',
    imageUrl: item.imageUrl || '',
    sourceName: item.sourceName,
    sourceDate: item.sourceDate,
    catalogItemKey: item.key,
    customItemId: null,
  };
}

function customOption(item) {
  return {
    type: 'custom',
    id: item.id,
    name: item.name,
    rangeLabel: item.rangeLabel || 'Unknown',
    category: 'Custom',
    imageUrl: item.imageUrl || '',
    sourceName: item.sourceName || 'Custom',
    sourceDate: 'Private',
    catalogItemKey: null,
    customItemId: item.id,
  };
}

export default function NonGEAddItemModal({
  categories,
  customItems,
  existingStocks,
  defaultCategoryId,
  onConfirm,
  onCreateCustomItem,
  onCancel,
}) {
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [targetBuyPrice, setTargetBuyPrice] = useState('');
  const [targetSellPrice, setTargetSellPrice] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRangeLabel, setCustomRangeLabel] = useState('Unknown');
  const [customWikiUrl, setCustomWikiUrl] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [error, setError] = useState('');

  const existingKeys = useMemo(() => new Set(
    existingStocks
      .map(stock => stock.catalogItemKey ? `catalog:${stock.catalogItemKey}` : `custom:${stock.customItemId}`)
      .filter(Boolean)
  ), [existingStocks]);

  const options = useMemo(() => {
    const normalized = normalizeNonGESearch(query);
    const catalogOptions = NON_GE_CATALOG.map(catalogOption);
    const customOptions = customItems.map(customOption);
    const allOptions = [...catalogOptions, ...customOptions];

    if (!normalized) return allOptions.slice(0, 80);
    return allOptions
      .filter(item => item.name.toLowerCase().includes(normalized))
      .slice(0, 80);
  }, [query, customItems]);

  const selectedKey = selectedItem ? `${selectedItem.type}:${selectedItem.id}` : '';
  const duplicateSelected = Boolean(selectedKey && existingKeys.has(selectedKey));
  const canConfirm = selectedItem && categoryId && !duplicateSelected;

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

  const handleCreateCustom = async () => {
    const name = customName.trim();
    if (!name) {
      setError('Custom item name is required.');
      return;
    }

    const created = await onCreateCustomItem({
      name,
      wikiUrl: customWikiUrl.trim(),
      imageUrl: customImageUrl.trim(),
      sourceName: 'Custom',
      rangeLabel: customRangeLabel.trim() || 'Unknown',
    });

    if (!created) {
      setError('Could not create custom item.');
      return;
    }

    setSelectedItem(customOption(created));
    setQuery(created.name);
    setShowCustomForm(false);
    setCustomName('');
    setCustomRangeLabel('Unknown');
    setCustomWikiUrl('');
    setCustomImageUrl('');
    setError('');
  };

  return (
    <div className="modal-container non-ge-modal non-ge-add-modal">
      <div className="non-ge-modal-header">
        <h2 className="modal-title">Add Non-GE Item</h2>
      </div>

      <label className="non-ge-field">
        <span>Search catalog and custom items</span>
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

      <button
        type="button"
        className="non-ge-custom-toggle"
        onClick={() => {
          setShowCustomForm(prev => !prev);
          setError('');
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
          <label className="non-ge-field">
            <span>Image URL</span>
            <div className="non-ge-search-input-wrap">
              <Image size={16} />
              <input
                type="url"
                value={customImageUrl}
                onChange={(event) => setCustomImageUrl(event.target.value)}
                placeholder="Optional"
                className="non-ge-input"
              />
            </div>
          </label>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateCustom}>
            Create Custom Item
          </button>
        </div>
      )}

      <div className="non-ge-option-list">
        {options.map(item => {
          const itemKey = `${item.type}:${item.id}`;
          const isSelected = selectedKey === itemKey;
          const isDuplicate = existingKeys.has(itemKey);

          return (
            <button
              key={itemKey}
              type="button"
              className={`non-ge-option-row${isSelected ? ' is-selected' : ''}${isDuplicate ? ' is-disabled' : ''}`}
              onClick={() => {
                setSelectedItem(item);
                setError('');
              }}
            >
              <ItemIcon
                src={item.imageUrl}
                alt=""
                className="non-ge-option-icon"
                fallbackText={item.name}
              />
              <span>
                <strong>{item.name}</strong>
                <small>{item.category} · {item.rangeLabel}</small>
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
        <div className="non-ge-modal-warning">This item already exists in your Non-GE tracker. Restore it from the archive if needed.</div>
      )}
      {error && <div className="non-ge-modal-error">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn-modal-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-modal-confirm" onClick={handleConfirm} disabled={!canConfirm}>Add Item</button>
      </div>
    </div>
  );
}
