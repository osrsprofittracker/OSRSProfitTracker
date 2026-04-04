import React, { useState, useMemo } from 'react';
import { formatNumber, handleMKInput } from '../../utils/formatters';

export default function BulkSellModal({ stocks, categories = [], tradeMode = 'trade', gePrices = {}, geIconMap = {}, onConfirm, onCancel, isSubmitting = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({});

  const groupedStocks = useMemo(() => {
    const filtered = stocks.filter(s =>
      (tradeMode === 'investment' ? s.isInvestment : !s.isInvestment) && s.shares > 0
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
        const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
        const avgSell = stock.sharesSold > 0 ? Math.round(stock.totalCostSold / stock.sharesSold) : null;
        const defaultPrice = geHigh || avgSell || '';
        next[stock.id] = {
          stock,
          shares: '',
          price: defaultPrice ? defaultPrice.toString() : '',
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

  const calculations = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    const perItem = {};

    for (const [id, item] of selectedEntries) {
      const shares = parseFloat(item.shares) || 0;
      const price = parseFloat(item.price) || 0;
      const revenue = shares * price;
      const avgBuy = item.stock.shares > 0 ? item.stock.totalCost / item.stock.shares : 0;
      const costBasis = avgBuy * shares;
      const profit = revenue - costBasis;
      const profitPercent = avgBuy > 0 ? ((price - avgBuy) / avgBuy) * 100 : 0;

      perItem[id] = { revenue, avgBuy, costBasis, profit, profitPercent };
      totalRevenue += revenue;
      totalProfit += profit;
    }

    return { perItem, totalRevenue, totalProfit };
  }, [selectedItems]);

  const canConfirm = useMemo(() => {
    if (selectedCount === 0) return false;
    return selectedEntries.every(([, item]) => {
      const s = parseFloat(item.shares);
      const p = parseFloat(item.price);
      return s > 0 && p > 0 && s <= item.stock.shares;
    });
  }, [selectedItems]);

  const handleConfirm = () => {
    if (!canConfirm || isSubmitting) return;
    const items = selectedEntries.map(([, item]) => ({
      stock: item.stock,
      shares: parseFloat(item.shares),
      price: parseFloat(item.price),
    }));
    onConfirm(items);
  };

  return (
    <div className="bulk-sell-modal">
      <div className="bulk-sell-header">
        <h2>Bulk Sell</h2>
        <div className="bulk-sell-item-count">
          {selectedCount > 0 && (
            <span className="bulk-sell-count-badge">{selectedCount}</span>
          )}
        </div>
      </div>

      <div className="bulk-sell-body">
        {/* Left: Item Picker */}
        <div className="bulk-sell-picker">
          <div className="bulk-sell-search">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bulk-sell-item-list">
            {filteredGroups.map(group => (
              <React.Fragment key={group.name}>
                <div className="bulk-sell-category-label">{group.name}</div>
                {group.stocks.map(stock => {
                  const isSelected = !!selectedItems[stock.id];
                  const avgBuy = stock.shares > 0 ? Math.round(stock.totalCost / stock.shares) : 0;
                  const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;

                  return (
                    <div
                      key={stock.id}
                      className={`bulk-sell-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleItem(stock)}
                    >
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <div className="item-info">
                        <div className="item-name">{stock.name}</div>
                        <div className="item-meta">
                          {formatNumber(stock.shares)} held | Avg: {formatNumber(avgBuy)}
                        </div>
                      </div>
                      {isSelected && <span className="item-check">&#10003;</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            {filteredGroups.length === 0 && (
              <div className="bulk-sell-empty-config">No stocks with holdings found</div>
            )}
          </div>
        </div>

        {/* Right: Config */}
        <div className="bulk-sell-config">
          <div className="bulk-sell-config-header">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </div>

          {selectedCount === 0 ? (
            <div className="bulk-sell-empty-config">
              Select items from the left panel to sell
            </div>
          ) : (
            <div className="bulk-sell-selected-list">
              {selectedEntries.map(([id, item]) => {
                const { stock } = item;
                const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;
                const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
                const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
                const calc = calculations.perItem[id];
                const shares = parseFloat(item.shares) || 0;
                const price = parseFloat(item.price) || 0;
                const overMax = shares > stock.shares;

                return (
                  <div key={id} className="bulk-sell-selected-item">
                    <div className="item-header">
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <span className="item-name">{stock.name}</span>
                      <span className="item-held">{formatNumber(stock.shares)} held</span>
                      <button className="remove-btn" onClick={() => removeItem(stock.id)}>&times;</button>
                    </div>

                    <div className="item-inputs">
                      <div className="input-group">
                        <input
                          type="text"
                          value={item.shares}
                          onChange={(e) => handleSharesInput(id, e.target.value)}
                          placeholder="Qty"
                          className={overMax ? 'input-error' : ''}
                        />
                        <button
                          className="sell-all-btn"
                          onClick={() => updateItem(id, 'shares', stock.shares.toString())}
                        >
                          ALL
                        </button>
                      </div>
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
                            className="bulk-sell-ge-btn low"
                            onClick={() => updateItem(id, 'price', geLow.toString())}
                          >
                            Low: {formatNumber(geLow)}
                          </button>
                        )}
                        {geHigh && (
                          <button
                            className="bulk-sell-ge-btn high"
                            onClick={() => updateItem(id, 'price', geHigh.toString())}
                          >
                            High: {formatNumber(geHigh)}
                          </button>
                        )}
                      </div>
                    )}

                    {shares > 0 && price > 0 && calc && (
                      <div className={`profit-preview ${calc.profit >= 0 ? 'profit' : 'loss'}`}>
                        <div className="profit-preview-row">
                          <span>Revenue</span>
                          <span>{formatNumber(calc.revenue, 'full')} GP</span>
                        </div>
                        <div className="profit-preview-row">
                          <span>Cost basis</span>
                          <span>{formatNumber(calc.costBasis, 'full')} GP</span>
                        </div>
                        <div className="profit-preview-divider"></div>
                        <div className="profit-preview-row profit-row">
                          <span>Profit</span>
                          <span>
                            {(calc.profit >= 0 ? '+' : '') + formatNumber(calc.profit, 'full')} GP
                            <span className="profit-pct">
                              ({(calc.profitPercent >= 0 ? '+' : '') + calc.profitPercent.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {overMax && (
                      <div className="item-error">
                        Exceeds available ({formatNumber(stock.shares)})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bulk-sell-footer">
        <div className="bulk-sell-footer-stats">
          <div className="bulk-sell-total">
            <span className="label">Revenue: </span>
            <span className="amount">{formatNumber(calculations.totalRevenue, 'full')} GP</span>
          </div>
          {selectedCount > 0 && (
            <div className={`bulk-sell-profit ${calculations.totalProfit >= 0 ? 'profit' : 'loss'}`}>
              <span className="label">Profit: </span>
              <span className="amount">
                {(calculations.totalProfit >= 0 ? '+' : '') + formatNumber(calculations.totalProfit, 'full')} GP
              </span>
            </div>
          )}
        </div>
        <div className="bulk-sell-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
          >
            {isSubmitting ? 'Selling...' : `Sell (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
