import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Package, FolderOpen, ArrowLeftRight, BarChart3, X } from 'lucide-react';

export default function GlobalSearch({
  stocks = [],
  categories = [],
  transactions = [],
  geMapping = [],
  geIconMap = {},
  navigateToPage
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Build search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedStocks = stocks
      .filter(s => s.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(s => {
        const parts = [s.category || 'Uncategorized'];
        parts.push(`${s.shares ? formatGP(s.shares) : '0'} held`);
        if (s.totalCost) parts.push(`${formatGP(s.totalCost)} invested`);
        return {
          type: 'stock',
          id: `stock-${s.id}`,
          name: s.name,
          detail: parts.join(' · '),
          data: s
        };
      });

    const matchedCategories = categories
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(c => {
        const count = stocks.filter(s => s.category === c.name).length;
        return {
          type: 'category',
          id: `cat-${c.id}`,
          name: c.name,
          detail: `${count} item${count !== 1 ? 's' : ''}`,
          data: c
        };
      });

    const matchedTransactions = transactions
      .filter(t => t.stockName.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => {
        const date = new Date(t.date).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short'
        });
        const parts = [date, `${formatGP(t.shares)} qty`, `${formatGP(t.price)} ea`, `${formatGP(t.total)} total`];
        if (t.profit != null && t.type === 'sell') parts.push(`${t.profit >= 0 ? '+' : ''}${formatGP(t.profit)} profit`);
        return {
          type: 'transaction',
          id: `tx-${t.id}`,
          name: t.stockName,
          detail: parts.join(' · '),
          data: t
        };
      });

    const matchedItems = (geMapping || [])
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(item => ({
        type: 'ge-item',
        id: `ge-${item.id}`,
        name: item.name,
        detail: 'View price chart',
        data: item
      }));

    return [
      ...matchedStocks,
      ...matchedCategories,
      ...matchedTransactions,
      ...matchedItems
    ];
  }, [query, stocks, categories, transactions, geMapping]);

  // Get section boundaries for display
  const sections = useMemo(() => {
    const groups = [];
    const types = [
      { key: 'stock', label: 'Stocks', icon: Package },
      { key: 'category', label: 'Categories', icon: FolderOpen },
      { key: 'transaction', label: 'Transactions', icon: ArrowLeftRight },
      { key: 'ge-item', label: 'GE Items', icon: BarChart3 }
    ];
    for (const t of types) {
      const items = results.filter(r => r.type === t.key);
      if (items.length > 0) {
        groups.push({ ...t, items });
      }
    }
    return groups;
  }, [results]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback((item) => {
    setIsOpen(false);
    switch (item.type) {
      case 'stock': {
        const category = item.data.category || 'Uncategorized';
        navigateToPage('trade');
        setTimeout(() => {
          const el = document.querySelector(`[data-category="${category}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      }
      case 'category': {
        navigateToPage('trade');
        setTimeout(() => {
          const el = document.querySelector(`[data-category="${item.data.name}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      }
      case 'transaction': {
        navigateToPage('history', { query: { search: item.data.stockName } });
        break;
      }
      case 'ge-item': {
        navigateToPage('graphs', { query: { item: item.data.id } });
        break;
      }
    }
  }, [navigateToPage]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect]);

  // Track flat index for keyboard nav
  let flatIndex = -1;

  const iconForType = (type) => {
    switch (type) {
      case 'stock': return Package;
      case 'category': return FolderOpen;
      case 'transaction': return ArrowLeftRight;
      case 'ge-item': return BarChart3;
      default: return Search;
    }
  };

  return (
    <>
      <button
        className="global-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Search (Ctrl+K)"
      >
        <Search size={18} />
        <span className="global-search-shortcut">Ctrl+K</span>
      </button>

      {isOpen && (
        <div className="global-search-overlay">
          <div className="global-search-modal" ref={modalRef}>
            <div className="global-search-input-wrapper">
              <Search size={20} className="global-search-input-icon" />
              <input
                ref={inputRef}
                type="text"
                className="global-search-input"
                placeholder="Search items, categories, transactions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="global-search-close"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="global-search-results">
              {query.trim() && results.length === 0 && (
                <div className="global-search-empty">
                  No results for "{query}"
                </div>
              )}

              {!query.trim() && (
                <div className="global-search-empty">
                  Start typing to search across your portfolio
                </div>
              )}

              {sections.map(section => {
                const SectionIcon = section.icon;
                return (
                  <div key={section.key} className={`global-search-section global-search-section-${section.key}`}>
                    <div className="global-search-section-header">
                      <SectionIcon size={14} />
                      <span>{section.label}</span>
                    </div>
                    {section.items.map(item => {
                      flatIndex++;
                      const currentIndex = flatIndex;
                      const isSelected = currentIndex === selectedIndex;
                      const ItemIcon = iconForType(item.type);
                      return (
                        <button
                          key={item.id}
                          className={`global-search-item ${isSelected ? 'global-search-item-selected' : ''}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                        >
                          <ItemIcon size={16} className={`global-search-item-icon global-search-icon-${item.type}`} />
                          <div className="global-search-item-content">
                            <span className="global-search-item-name">{item.name}</span>
                            <span className="global-search-item-detail">{item.detail}</span>
                          </div>
                          {item.type === 'transaction' && (
                            <span className={`global-search-tx-badge global-search-tx-${item.data.type}`}>
                              {item.data.type.toUpperCase()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatGP(value) {
  if (value == null) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toLocaleString();
}
