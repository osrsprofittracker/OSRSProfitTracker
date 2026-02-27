import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function NewStockModal({ categories, defaultCategory = '', defaultIsInvestment = false, mapping = [], onConfirm, onCancel }) {
  const [stockType, setStockType] = useState('osrs'); // 'osrs' | 'custom'
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [limit4h, setLimit4h] = useState('');
  const [needed, setNeeded] = useState('');
  const [isInvestment, setIsInvestment] = useState(defaultIsInvestment || false);
  const [itemId, setItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredCategories = categories.filter(c => c.isInvestment === isInvestment).map(c => c.name);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mapping.filter(item => item.name.toLowerCase().includes(q)).slice(0, 50);
  }, [searchQuery, mapping]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item) => {
    setItemId(item.id);
    setName(item.name);
    setLimit4h(item.limit?.toString() || '');
    setSearchQuery(item.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    setItemId(null);
    setName(e.target.value);
  };

  const handleConfirm = () => {
    if (!canConfirm()) return;
    if (!name.trim() || !limit4h) return;
    onConfirm({
      name: name.trim(),
      category: category || 'Uncategorized',
      limit4h: parseFloat(limit4h),
      needed: parseFloat(needed) || 0,
      isInvestment,
      itemId: stockType === 'osrs' ? itemId : null,
    });
  };

  const canConfirm = () => {
    if (!limit4h) return false;
    if (stockType === 'osrs') return itemId !== null;
    return name.trim().length > 0;
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 1rem',
    background: 'rgb(51, 65, 85)',
    borderRadius: '0.5rem',
    outline: 'none',
    border: '2px solid transparent',
    color: 'white',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Stock</h2>

      {/* Type Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => { setStockType('osrs'); setName(''); setLimit4h(''); setItemId(null); setSearchQuery(''); }}
          style={{
            flex: 1, padding: '0.4rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem',
            background: stockType === 'osrs' ? 'rgb(37, 99, 235)' : 'rgb(51, 65, 85)',
            color: 'white'
          }}
        >
          🏷️ OSRS Item
        </button>
        <button
          onClick={() => { setStockType('custom'); setName(''); setLimit4h(''); setItemId(null); setSearchQuery(''); }}
          style={{
            flex: 1, padding: '0.4rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem',
            background: stockType === 'custom' ? 'rgb(71, 85, 105)' : 'rgb(51, 65, 85)',
            color: 'white'
          }}
        >
          ✏️ Custom
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* OSRS Item Search */}
        {stockType === 'osrs' && (
          <div style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery) setShowDropdown(true); }}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
              placeholder="Search OSRS item..."
              style={inputStyle}
            />
            {itemId ? (
              <div style={{ fontSize: '0.75rem', color: 'rgb(134, 239, 172)', marginTop: '0.25rem' }}>
                ✓ Linked to item ID {itemId}
              </div>
            ) : searchQuery ? (
              <div style={{ fontSize: '0.75rem', color: 'rgb(251, 146, 60)', marginTop: '0.25rem' }}>
                ⚠ Select an item from the dropdown to link
              </div>
            ) : null}
            {showDropdown && filteredItems.length > 0 && (
              <div ref={dropdownRef} style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'rgb(30, 41, 59)', border: '1px solid rgb(71, 85, 105)',
                borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)', marginTop: '2px'
              }}>
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onMouseDown={() => handleSelectItem(item)}
                    style={{
                      padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem',
                      borderBottom: '1px solid rgb(51, 65, 85)', display: 'flex', justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{item.name}</span>
                    <span style={{ color: 'rgb(148, 163, 184)', fontSize: '0.75rem' }}>
                      Limit: {item.limit?.toLocaleString() ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom name input */}
        {stockType === 'custom' && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stock name"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        )}

        {/* 4H Limit */}
        <input
          type="number"
          value={limit4h}
          onChange={(e) => setLimit4h(e.target.value)}
          placeholder="4H Limit"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />

        {/* Desired Stock */}
        <input
          type="number"
          value={needed}
          onChange={(e) => setNeeded(e.target.value)}
          placeholder="Desired stock"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        >
          {filteredCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="checkbox-investment">
          <input
            type="checkbox"
            checked={isInvestment}
            onChange={(e) => setIsInvestment(e.target.checked)}
            className="checkbox-input"
          />
          <span className="checkbox-investment-text">📈 Mark as Investment</span>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            style={{
              flex: 1, padding: '0.5rem 1rem',
              background: canConfirm() ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
              borderRadius: '0.5rem', border: 'none', color: 'white',
              cursor: canConfirm() ? 'pointer' : 'not-allowed', fontWeight: '500',
              opacity: canConfirm() ? 1 : 0.6
            }}
            onMouseOver={(e) => { if (canConfirm()) e.currentTarget.style.background = 'rgb(29, 78, 216)'; }}
            onMouseOut={(e) => { if (canConfirm()) e.currentTarget.style.background = 'rgb(37, 99, 235)'; }}
          >
            Add
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.5rem 1rem', background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem', border: 'none', color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}