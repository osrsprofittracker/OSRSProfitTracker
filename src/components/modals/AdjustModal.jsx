import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function AdjustModal({ stock, categories, mapping = [], onConfirm, onCancel }) {
  const [stockType, setStockType] = useState(stock.itemId ? 'osrs' : 'custom');
  const [name, setName] = useState(stock.name);
  const [needed, setNeeded] = useState(stock.needed.toString());
  const [category, setCategory] = useState(stock.category || 'Uncategorized');
  const [limit4h, setLimit4h] = useState(stock.limit4h.toString());
  const [onHold, setOnHold] = useState(stock.onHold || false);
  const [isInvestment, setIsInvestment] = useState(stock.isInvestment || false);
  const [targetCategory, setTargetCategory] = useState('Uncategorized');
  const [itemId, setItemId] = useState(stock.itemId || null);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (stock.itemId && mapping.length) {
      return mapping.find(m => m.id === stock.itemId)?.name || stock.name;
    }
    return stock.name;
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const modeChanged = isInvestment !== (stock.isInvestment || false);
  const targetCategories = categories.filter(c => c.isInvestment === isInvestment).map(c => c.name);
  const currentCategories = categories.filter(c => c.isInvestment === (stock.isInvestment || false)).map(c => c.name);

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
    setLimit4h(item.limit?.toString() || limit4h);
    setSearchQuery(item.name);
    setShowDropdown(false);
  };

  const handleSwitchType = (type) => {
    setStockType(type);
    if (type === 'custom') {
      setItemId(null);
      setSearchQuery('');
      setName(stock.name);
      setLimit4h(stock.limit4h.toString());
    } else {
      setItemId(stock.itemId || null);
      setSearchQuery(stock.itemId && mapping.length
        ? mapping.find(m => m.id === stock.itemId)?.name || ''
        : '');
      setName('');
      setLimit4h('');
    }
  };

  const canConfirm = () => {
    if (!needed || !limit4h) return false;
    if (stockType === 'osrs') return itemId !== null;
    return name.trim().length > 0;
  };

  const handleConfirm = () => {
    if (!canConfirm()) return;
    onConfirm({
      name: name.trim(),
      needed: parseFloat(needed),
      category: modeChanged ? targetCategory : category,
      limit4h: parseFloat(limit4h),
      onHold,
      isInvestment,
      itemId: stockType === 'osrs' ? itemId : null,
    });
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

  const focusColor = 'rgb(202, 138, 4)';

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Adjust {stock.name}
      </h2>

      {/* Type Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => handleSwitchType('osrs')}
          style={{
            flex: 1, padding: '0.4rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem',
            background: stockType === 'osrs' ? 'rgb(202, 138, 4)' : 'rgb(51, 65, 85)',
            color: 'white'
          }}
        >
          🏷️ OSRS Item
        </button>
        <button
          onClick={() => handleSwitchType('custom')}
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
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
              OSRS Item
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setItemId(null); setName(e.target.value); }}
                onFocus={(e) => { e.target.style.borderColor = focusColor; if (searchQuery) setShowDropdown(true); }}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                placeholder="Search OSRS item..."
                style={inputStyle}
              />
              {itemId ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgb(134, 239, 172)' }}>✓ Linked (ID: {itemId})</span>
                  <button
                    onMouseDown={() => { setItemId(null); setSearchQuery(''); setName(''); setLimit4h(''); }}
                    style={{ fontSize: '0.75rem', color: 'rgb(248, 113, 113)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'rgb(251, 146, 60)', marginTop: '0.25rem' }}>
                  ⚠ Select an item from the dropdown to link
                </div>
              )}
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
          </div>
        )}

        {/* Custom name input */}
        {stockType === 'custom' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
              Stock Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter stock name"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = focusColor}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
          </div>
        )}

        {/* 4H Limit */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            4H Limit
          </label>
          <input
            type="number"
            value={limit4h}
            onChange={(e) => setLimit4h(e.target.value)}
            placeholder="Enter 4h limit"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = focusColor}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        {/* Desired Stock */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            Desired Stock
          </label>
          <input
            type="number"
            value={needed}
            onChange={(e) => setNeeded(e.target.value)}
            placeholder="Enter desired stock"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = focusColor}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
            {modeChanged ? 'Target Category' : 'Category'}
          </label>
          <select
            value={modeChanged ? targetCategory : category}
            onChange={(e) => modeChanged ? setTargetCategory(e.target.value) : setCategory(e.target.value)}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = focusColor}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          >
            {(modeChanged ? targetCategories : currentCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <label className="checkbox-investment">
          <input
            type="checkbox"
            checked={isInvestment}
            onChange={(e) => setIsInvestment(e.target.checked)}
            className="checkbox-input"
          />
          <span className="checkbox-investment-text">📈 Mark as Investment</span>
        </label>

        <div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
            padding: '0.75rem', background: 'rgb(51, 65, 85)', borderRadius: '0.5rem'
          }}>
            <input
              type="checkbox"
              checked={onHold}
              onChange={(e) => setOnHold(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
              🔒 Put on hold (don't buy this stock)
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            style={{
              flex: 1, padding: '0.5rem 1rem',
              background: canConfirm() ? 'rgb(202, 138, 4)' : 'rgb(71, 85, 105)',
              borderRadius: '0.5rem', border: 'none', color: 'white',
              cursor: canConfirm() ? 'pointer' : 'not-allowed', fontWeight: '500',
              opacity: canConfirm() ? 1 : 0.6
            }}
            onMouseOver={(e) => { if (canConfirm()) e.currentTarget.style.background = 'rgb(161, 98, 7)'; }}
            onMouseOut={(e) => { if (canConfirm()) e.currentTarget.style.background = 'rgb(202, 138, 4)'; }}
          >
            Save
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