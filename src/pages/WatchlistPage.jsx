import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Eye, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { useGEData } from '../contexts/GEDataContext';
import { formatNumber } from '../utils/formatters';
import '../styles/watchlist-page.css';

function parseTargetValue(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.floor(numeric);
}

export default function WatchlistPage({
  watchlistItems = [],
  loading = false,
  onAddWatchlistItem,
  onUpdateWatchlistItem,
  onDeleteWatchlistItem,
  onConvertToStock,
  onOpenPriceAlert,
}) {
  const { geMapping, gePrices, geIconMap, mappingLoading } = useGEData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [targetBuyPrice, setTargetBuyPrice] = useState('');
  const [targetSellPrice, setTargetSellPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return geMapping.filter(item => item.name.toLowerCase().includes(q)).slice(0, 40);
  }, [searchQuery, geMapping]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!showDropdown) return;
      if (dropdownRef.current?.contains(event.target)) return;
      if (searchRef.current?.contains(event.target)) return;
      setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const resetForm = () => {
    setEditingItemId(null);
    setSearchQuery('');
    setSelectedItemId(null);
    setSelectedItemName('');
    setTargetBuyPrice('');
    setTargetSellPrice('');
    setNotes('');
    setError('');
    setShowDropdown(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setSearchQuery(item.itemName);
    setSelectedItemId(item.itemId);
    setSelectedItemName(item.itemName);
    setTargetBuyPrice(item.targetBuyPrice ? String(item.targetBuyPrice) : '');
    setTargetSellPrice(item.targetSellPrice ? String(item.targetSellPrice) : '');
    setNotes(item.notes || '');
    setError('');
    setShowDropdown(false);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setSelectedItemName(item.name);
    setSearchQuery(item.name);
    setShowDropdown(false);
    setError('');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const parsedBuy = parseTargetValue(targetBuyPrice);
    const parsedSell = parseTargetValue(targetSellPrice);

    if (!parsedBuy && !parsedSell) {
      setError('Set at least one target price.');
      return;
    }

    if (!editingItemId && !selectedItemId) {
      setError('Select an item from the dropdown.');
      return;
    }

    const duplicateItem = watchlistItems.some(
      item => item.itemId === selectedItemId && item.id !== editingItemId
    );
    if (!editingItemId && duplicateItem) {
      setError('This item is already in your watchlist.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let success = false;
      if (editingItemId) {
        success = await onUpdateWatchlistItem(editingItemId, {
          targetBuyPrice: parsedBuy,
          targetSellPrice: parsedSell,
          notes,
        });
      } else {
        success = await onAddWatchlistItem({
          itemId: selectedItemId,
          itemName: selectedItemName,
          targetBuyPrice: parsedBuy,
          targetSellPrice: parsedSell,
          notes,
        });
      }

      if (!success) {
        setError('Could not save watchlist item. Please try again.');
        return;
      }

      handleCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <div className="watchlist-header-copy">
          <h1 className="watchlist-title">
            <Eye size={22} />
            <span>Watchlist</span>
          </h1>
          <p className="watchlist-subtitle">
            Track non-owned items, set target prices, and convert opportunities into active trades.
          </p>
        </div>
        <button className="btn btn-primary watchlist-add-btn" onClick={handleStartCreate}>
          <Plus size={16} />
          Add Watchlist Item
        </button>
      </div>

      {isFormOpen && (
        <div className="watchlist-form-card">
          <h2 className="watchlist-form-title">
            {editingItemId ? 'Edit Watchlist Item' : 'New Watchlist Item'}
          </h2>

          <div className="watchlist-form-grid">
            <div className="watchlist-form-group watchlist-form-group-full">
              <label className="watchlist-form-label">Item</label>
              <input
                ref={searchRef}
                type="text"
                className="watchlist-form-input"
                placeholder={mappingLoading ? 'Loading items...' : 'Search for item...'}
                value={searchQuery}
                onChange={(event) => {
                  if (editingItemId) return;
                  setSearchQuery(event.target.value);
                  setSelectedItemId(null);
                  setSelectedItemName('');
                  setShowDropdown(true);
                  setError('');
                }}
                onFocus={() => {
                  if (!editingItemId && searchQuery.trim()) setShowDropdown(true);
                }}
                disabled={mappingLoading || !!editingItemId}
              />
              {showDropdown && filteredItems.length > 0 && !editingItemId && (
                <div className="watchlist-search-dropdown" ref={dropdownRef}>
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      className="watchlist-search-option"
                      onMouseDown={() => handleSelectItem(item)}
                    >
                      <span>{item.name}</span>
                      <span className="watchlist-search-option-limit">
                        Limit: {item.limit?.toLocaleString() ?? '-'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="watchlist-form-group">
              <label className="watchlist-form-label">Target Buy (Low)</label>
              <input
                type="number"
                min="1"
                className="watchlist-form-input"
                placeholder="e.g. 2350000"
                value={targetBuyPrice}
                onChange={(event) => setTargetBuyPrice(event.target.value)}
              />
            </div>

            <div className="watchlist-form-group">
              <label className="watchlist-form-label">Target Sell (High)</label>
              <input
                type="number"
                min="1"
                className="watchlist-form-input"
                placeholder="e.g. 2560000"
                value={targetSellPrice}
                onChange={(event) => setTargetSellPrice(event.target.value)}
              />
            </div>

            <div className="watchlist-form-group watchlist-form-group-full">
              <label className="watchlist-form-label">Notes</label>
              <textarea
                className="watchlist-form-textarea"
                placeholder="Optional note"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          {error && <div className="watchlist-form-error">{error}</div>}

          <div className="watchlist-form-actions">
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingItemId ? 'Update' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      <div className="table-container watchlist-table-wrap">
        {loading ? (
          <div className="watchlist-empty">Loading watchlist...</div>
        ) : watchlistItems.length === 0 ? (
          <div className="watchlist-empty">
            No watchlist items yet. Add one to start tracking buy/sell targets.
          </div>
        ) : (
          <table className="table-base watchlist-table">
            <thead className="thead-base">
              <tr>
                <th className="th-base">Item</th>
                <th className="th-base td-right">GE High</th>
                <th className="th-base td-right">GE Low</th>
                <th className="th-base td-right">Target Buy</th>
                <th className="th-base td-right">Target Sell</th>
                <th className="th-base">Status</th>
                <th className="th-base">Notes</th>
                <th className="th-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlistItems.map((item, index) => {
                const live = gePrices[item.itemId];
                const high = live?.high ?? null;
                const low = live?.low ?? null;
                const buyHit = item.targetBuyPrice && low != null && low <= item.targetBuyPrice;
                const sellHit = item.targetSellPrice && high != null && high >= item.targetSellPrice;
                const statusLabel = buyHit
                  ? 'Buy target hit'
                  : sellHit
                    ? 'Sell target hit'
                    : 'Watching';

                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                    <td className="td-base watchlist-item-cell">
                      {geIconMap[item.itemId] && (
                        <img
                          src={geIconMap[item.itemId]}
                          alt=""
                          className="watchlist-item-icon"
                        />
                      )}
                      <span>{item.itemName}</span>
                    </td>
                    <td className="td-base td-right">
                      {high != null ? formatNumber(high, 'full') : '-'}
                    </td>
                    <td className="td-base td-right">
                      {low != null ? formatNumber(low, 'full') : '-'}
                    </td>
                    <td className="td-base td-right">
                      {item.targetBuyPrice ? formatNumber(item.targetBuyPrice, 'full') : '-'}
                    </td>
                    <td className="td-base td-right">
                      {item.targetSellPrice ? formatNumber(item.targetSellPrice, 'full') : '-'}
                    </td>
                    <td className="td-base">
                      <span
                        className={`watchlist-status-badge ${
                          buyHit || sellHit
                            ? 'watchlist-status-badge-hit'
                            : 'watchlist-status-badge-watching'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="td-base watchlist-notes-cell" title={item.notes || ''}>
                      {item.notes || '-'}
                    </td>
                    <td className="td-base">
                      <div className="watchlist-actions">
                        <button
                          className="btn btn-blue btn-sm watchlist-action-btn"
                          onClick={() =>
                            onOpenPriceAlert?.({
                              itemId: item.itemId,
                              itemName: item.itemName,
                              defaultHighThreshold: item.targetSellPrice ?? null,
                              defaultLowThreshold: item.targetBuyPrice ?? null,
                            })
                          }
                          title="Open price alert modal"
                        >
                          <Bell size={12} />
                          <span>Alert</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm watchlist-action-btn"
                          onClick={() => handleStartEdit(item)}
                        >
                          <RefreshCw size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          className="btn btn-success btn-sm watchlist-action-btn"
                          onClick={() => onConvertToStock?.(item)}
                        >
                          <ShoppingCart size={12} />
                          <span>Buy</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm watchlist-action-btn"
                          onClick={() => onDeleteWatchlistItem?.(item.id)}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
