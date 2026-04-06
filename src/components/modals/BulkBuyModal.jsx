import React, { useState, useMemo } from 'react';
import { formatNumber, parseMK, handleMKInput } from '../../utils/formatters';
import '../../styles/bulk-modals.css';

export default function BulkBuyModal({ stocks, categories = [], tradeMode = 'trade', gePrices = {}, geIconMap = {}, onConfirm, onCancel, isSubmitting = false }) {
  const [mode, setMode] = useState('perItem');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [budget, setBudget] = useState('');

  // Build grouped stocks in category order (matching main trade screen)
  const groupedStocks = useMemo(() => {
    const filtered = stocks.filter(s =>
      tradeMode === 'investment' ? s.isInvestment : !s.isInvestment
    );
    const filteredCats = categories.filter(c =>
      tradeMode === 'investment' ? c.isInvestment : !c.isInvestment
    );
    const catNames = filteredCats.map(c => c.name);

    const groups = [];
    for (const cat of filteredCats) {
      const catStocks = filtered.filter(s => s.category === cat.name);
      if (catStocks.length > 0) {
        groups.push({ name: cat.name, stocks: catStocks });
      }
    }

    const uncategorized = filtered.filter(s =>
      s.category === 'Uncategorized' || !s.category || !catNames.includes(s.category)
    );
    if (uncategorized.length > 0 && !filteredCats.some(c => c.name === 'Uncategorized')) {
      groups.push({ name: 'Uncategorized', stocks: uncategorized });
    }

    return groups;
  }, [stocks, categories, tradeMode]);

  // Filtered groups for search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedStocks;
    const q = searchQuery.toLowerCase();
    return groupedStocks
      .map(g => ({ ...g, stocks: g.stocks.filter(s => s.name.toLowerCase().includes(q)) }))
      .filter(g => g.stocks.length > 0);
  }, [groupedStocks, searchQuery]);

  const toggleItem = (stock) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[stock.id]) {
        delete next[stock.id];
      } else {
        const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
        const avgBuy = stock.shares > 0 ? Math.round(stock.totalCost / stock.shares) : 0;
        const defaultPrice = avgBuy || geLow || '';
        next[stock.id] = {
          stock,
          shares: stock.limit4h ? stock.limit4h.toString() : '',
          price: defaultPrice ? defaultPrice.toString() : '',
          startTimer: true,
        };
      }
      return next;
    });
  };

  const removeItem = (stockId) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      delete next[stockId];
      return next;
    });
  };

  const updateItem = (stockId, field, value) => {
    setSelectedItems(prev => ({
      ...prev,
      [stockId]: { ...prev[stockId], [field]: value },
    }));
  };

  const handleSharesInput = (stockId, value) => {
    handleMKInput(value, (v) => updateItem(stockId, 'shares', v));
  };

  const handlePriceInput = (stockId, value) => {
    handleMKInput(value, (v) => updateItem(stockId, 'price', v));
  };

  const selectedEntries = Object.entries(selectedItems);
  const selectedCount = selectedEntries.length;

  // Per-item totals and grand total
  const perItemTotals = useMemo(() => {
    const totals = {};
    let grand = 0;
    for (const [id, item] of selectedEntries) {
      const s = parseFloat(item.shares) || 0;
      const p = parseFloat(item.price) || 0;
      const t = s * p;
      totals[id] = t;
      grand += t;
    }
    return { totals, grand };
  }, [selectedItems]);

  // Budget split calculations - uses custom price per item
  const budgetCalc = useMemo(() => {
    if (mode !== 'budgetSplit' || !budget) return null;
    const totalBudget = parseFloat(budget) || 0;
    if (totalBudget <= 0 || selectedCount === 0) return null;

    const eligible = selectedEntries.filter(([, item]) => {
      const price = parseFloat(item.price) || 0;
      return price > 0;
    });

    if (eligible.length === 0) return { allocations: {}, remainder: totalBudget, totalSpent: 0 };

    const perItem = Math.floor(totalBudget / eligible.length);
    const allocations = {};
    let totalSpent = 0;

    for (const [id, item] of eligible) {
      const price = parseFloat(item.price);
      const shares = Math.floor(perItem / price);
      const spent = shares * price;
      totalSpent += spent;
      allocations[id] = { shares, price, allocated: perItem, spent };
    }

    return { allocations, remainder: totalBudget - totalSpent, totalSpent };
  }, [mode, budget, selectedItems]);

  const canConfirm = useMemo(() => {
    if (selectedCount === 0) return false;
    if (mode === 'perItem') {
      return selectedEntries.every(([, item]) => {
        const s = parseFloat(item.shares);
        const p = parseFloat(item.price);
        return s > 0 && p > 0;
      });
    }
    if (mode === 'budgetSplit') {
      return budgetCalc && budgetCalc.totalSpent > 0;
    }
    return false;
  }, [mode, selectedItems, budgetCalc]);

  const handleConfirm = () => {
    if (!canConfirm || isSubmitting) return;

    let items;
    if (mode === 'perItem') {
      items = selectedEntries.map(([, item]) => ({
        stock: item.stock,
        shares: parseFloat(item.shares),
        price: parseFloat(item.price),
        startTimer: item.startTimer,
      }));
    } else {
      items = selectedEntries
        .filter(([id]) => budgetCalc?.allocations[id]?.shares > 0)
        .map(([id, item]) => ({
          stock: item.stock,
          shares: budgetCalc.allocations[id].shares,
          price: budgetCalc.allocations[id].price,
          startTimer: item.startTimer,
        }));
    }

    onConfirm(items);
  };

  return (
    <div className="bulk-buy-modal">
      {/* Header */}
      <div className="bulk-buy-header">
        <h2>Bulk Buy</h2>
        <div className="bulk-buy-mode-toggle">
          <button
            className={`bulk-buy-mode-btn ${mode === 'perItem' ? 'active' : ''}`}
            onClick={() => setMode('perItem')}
          >
            Per-Item
          </button>
          <button
            className={`bulk-buy-mode-btn ${mode === 'budgetSplit' ? 'active' : ''}`}
            onClick={() => setMode('budgetSplit')}
          >
            Budget Split
          </button>
        </div>
      </div>

      {/* Body: two panels */}
      <div className="bulk-buy-body">
        {/* Left: Item Picker */}
        <div className="bulk-buy-picker">
          <div className="bulk-buy-search">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bulk-buy-item-list">
            {filteredGroups.map(group => (
              <React.Fragment key={group.name}>
                <div className="bulk-buy-category-label">{group.name}</div>
                {group.stocks.map(stock => {
                  const isSelected = !!selectedItems[stock.id];
                  const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
                  const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
                  const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;

                  return (
                    <div
                      key={stock.id}
                      className={`bulk-buy-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleItem(stock)}
                    >
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <div className="item-info">
                        <div className="item-name">{stock.name}</div>
                        <div className="item-meta">
                          {formatNumber(stock.shares)} held
                          {geLow ? ` | GE: ${formatNumber(geLow)}` : ''}
                          {geHigh ? ` / ${formatNumber(geHigh)}` : ''}
                        </div>
                      </div>
                      {isSelected && <span className="item-check">&#10003;</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            {filteredGroups.length === 0 && (
              <div className="bulk-buy-empty-config">No stocks found</div>
            )}
          </div>
        </div>

        {/* Right: Config */}
        <div className="bulk-buy-config">
          <div className="bulk-buy-config-header">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </div>

          {mode === 'budgetSplit' && (
            <div className="bulk-buy-budget-row">
              <label>Total Budget (GP)</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => handleMKInput(e.target.value, setBudget)}
                placeholder="e.g. 100m"
              />
            </div>
          )}

          {selectedCount === 0 ? (
            <div className="bulk-buy-empty-config">
              Select items from the left panel to get started
            </div>
          ) : (
            <div className="bulk-buy-selected-list">
              {selectedEntries.map(([id, item]) => {
                const { stock } = item;
                const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;
                const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
                const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
                const allocation = budgetCalc?.allocations[id];

                return (
                  <div key={id} className="bulk-buy-selected-item">
                    <div className="item-header">
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <span className="item-name">{stock.name}</span>
                      <button className="remove-btn" onClick={() => removeItem(stock.id)}>&times;</button>
                    </div>

                    {mode === 'perItem' ? (
                      <>
                        <div className="item-inputs">
                          <input
                            type="text"
                            value={item.shares}
                            onChange={(e) => handleSharesInput(id, e.target.value)}
                            placeholder="Shares"
                          />
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => handlePriceInput(id, e.target.value)}
                            placeholder="Price"
                          />
                        </div>
                        {(geLow || geHigh) && (
                          <div className="ge-btns">
                            {geLow && (
                              <button
                                className="bulk-buy-ge-btn low"
                                onClick={() => updateItem(id, 'price', geLow.toString())}
                              >
                                Low: {formatNumber(geLow)}
                              </button>
                            )}
                            {geHigh && (
                              <button
                                className="bulk-buy-ge-btn high"
                                onClick={() => updateItem(id, 'price', geHigh.toString())}
                              >
                                High: {formatNumber(geHigh)}
                              </button>
                            )}
                          </div>
                        )}
                        {perItemTotals.totals[id] > 0 && (
                          <div className="item-subtotal">
                            Total: {formatNumber(perItemTotals.totals[id], 'full')} GP
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="item-inputs">
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => handlePriceInput(id, e.target.value)}
                            placeholder="Buy price"
                          />
                        </div>
                        {(geLow || geHigh) && (
                          <div className="ge-btns">
                            {geLow && (
                              <button
                                className="bulk-buy-ge-btn low"
                                onClick={() => updateItem(id, 'price', geLow.toString())}
                              >
                                Low: {formatNumber(geLow)}
                              </button>
                            )}
                            {geHigh && (
                              <button
                                className="bulk-buy-ge-btn high"
                                onClick={() => updateItem(id, 'price', geHigh.toString())}
                              >
                                High: {formatNumber(geHigh)}
                              </button>
                            )}
                          </div>
                        )}
                        <div className="budget-info">
                          {allocation ? (
                            <div className="shares-calc">
                              {formatNumber(allocation.shares)} shares @ {formatNumber(allocation.price)} = {formatNumber(allocation.spent, 'full')} GP
                            </div>
                          ) : (
                            <div>{parseFloat(item.price) > 0 ? 'Enter budget above' : 'Set a buy price'}</div>
                          )}
                        </div>
                      </>
                    )}

                    <label className="timer-row">
                      <input
                        type="checkbox"
                        checked={item.startTimer}
                        onChange={(e) => updateItem(id, 'startTimer', e.target.checked)}
                      />
                      Start timer
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bulk-buy-footer">
        <div>
          <div className="bulk-buy-total">
            <span className="label">Total: </span>
            <span className="amount">
              {mode === 'perItem'
                ? formatNumber(perItemTotals.grand, 'full')
                : formatNumber(budgetCalc?.totalSpent || 0, 'full')
              } GP
            </span>
          </div>
          {mode === 'budgetSplit' && budgetCalc && budgetCalc.remainder > 0 && (
            <div className="bulk-buy-remainder">
              Remainder: {formatNumber(budgetCalc.remainder, 'full')} GP (cannot be evenly spent)
            </div>
          )}
        </div>
        <div className="bulk-buy-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
          >
            {isSubmitting ? 'Buying...' : `Confirm (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
