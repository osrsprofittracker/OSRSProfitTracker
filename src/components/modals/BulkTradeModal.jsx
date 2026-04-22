import React, { useState, useMemo } from 'react';
import { useGroupedStocks } from '../../hooks/useGroupedStocks';
import { formatNumber, handleMKInput } from '../../utils/formatters';
import { useGEData } from '../../contexts/GEDataContext';
import { useTrade } from '../../contexts/TradeContext';
import '../../styles/bulk-trade-modal.css';
import StepInput from '../StepInput';

export default function BulkTradeModal({ mode, tradeMode = 'trade', onConfirm, onCancel, isSubmitting = false }) {
  const isBuy = mode === 'buy';
  const { gePrices, geIconMap } = useGEData();
  const { stocks, categories } = useTrade();
  const [buyMode, setBuyMode] = useState('perItem');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [budget, setBudget] = useState('');

  const groupedStocks = useGroupedStocks(
    stocks,
    categories,
    tradeMode,
    isBuy ? undefined : { requireShares: true }
  );

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
      } else if (isBuy) {
        const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
        const avgBuy = stock.shares > 0 ? Math.round(stock.totalCost / stock.shares) : 0;
        const defaultPrice = avgBuy || geLow || '';
        next[stock.id] = {
          stock,
          shares: stock.limit4h ? stock.limit4h.toString() : '',
          price: defaultPrice ? defaultPrice.toString() : '',
          startTimer: true,
        };
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

  // Buy: per-item totals
  const perItemTotals = useMemo(() => {
    if (!isBuy) return { totals: {}, grand: 0 };
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
  }, [isBuy, selectedItems]);

  // Buy: budget split
  const budgetCalc = useMemo(() => {
    if (!isBuy || buyMode !== 'budgetSplit' || !budget) return null;
    const totalBudget = parseFloat(budget) || 0;
    if (totalBudget <= 0 || selectedCount === 0) return null;

    const eligible = selectedEntries.filter(([, item]) => (parseFloat(item.price) || 0) > 0);
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
  }, [isBuy, buyMode, budget, selectedItems]);

  // Sell: profit calculations
  const sellCalc = useMemo(() => {
    if (isBuy) return { perItem: {}, totalRevenue: 0, totalProfit: 0 };
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
  }, [isBuy, selectedItems]);

  const canConfirm = useMemo(() => {
    if (selectedCount === 0) return false;
    if (isBuy) {
      if (buyMode === 'perItem') {
        return selectedEntries.every(([, item]) => {
          const s = parseFloat(item.shares);
          const p = parseFloat(item.price);
          return s > 0 && p > 0;
        });
      }
      if (buyMode === 'budgetSplit') {
        return budgetCalc && budgetCalc.totalSpent > 0;
      }
      return false;
    }
    return selectedEntries.every(([, item]) => {
      const s = parseFloat(item.shares);
      const p = parseFloat(item.price);
      return s > 0 && p > 0 && s <= item.stock.shares;
    });
  }, [isBuy, buyMode, selectedItems, budgetCalc]);

  const handleConfirm = () => {
    if (!canConfirm || isSubmitting) return;

    let items;
    if (isBuy) {
      if (buyMode === 'perItem') {
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
    } else {
      items = selectedEntries.map(([, item]) => ({
        stock: item.stock,
        shares: parseFloat(item.shares),
        price: parseFloat(item.price),
      }));
    }

    onConfirm(items);
  };

  const modeClass = isBuy ? 'mode-buy' : 'mode-sell';
  const emptyPickerText = isBuy ? 'No items found' : 'No items with holdings found';
  const emptyConfigText = isBuy
    ? 'Select items from the left panel to get started'
    : 'Select items from the left panel to sell';

  return (
    <div className={`bulk-trade-modal ${modeClass}`}>
      {/* Header */}
      <div className="bulk-trade-header">
        <h2>{isBuy ? 'Bulk Buy' : 'Bulk Sell'}</h2>
        {isBuy ? (
          <div className="bulk-trade-mode-toggle">
            <button
              className={`bulk-trade-mode-btn ${buyMode === 'perItem' ? 'active' : ''}`}
              onClick={() => setBuyMode('perItem')}
            >
              Per-Item
            </button>
            <button
              className={`bulk-trade-mode-btn ${buyMode === 'budgetSplit' ? 'active' : ''}`}
              onClick={() => setBuyMode('budgetSplit')}
            >
              Budget Split
            </button>
          </div>
        ) : (
          selectedCount > 0 && (
            <span className="bulk-trade-count-badge">{selectedCount}</span>
          )
        )}
      </div>

      {/* Body */}
      <div className="bulk-trade-body">
        {/* Left: Item Picker */}
        <div className="bulk-trade-picker">
          <div className="bulk-trade-search">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bulk-trade-item-list">
            {filteredGroups.map(group => (
              <React.Fragment key={group.name}>
                <div className="bulk-trade-category-label">{group.name}</div>
                {group.stocks.map(stock => {
                  const isSelected = !!selectedItems[stock.id];
                  const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;
                  const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
                  const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
                  const avgBuy = stock.shares > 0 ? Math.round(stock.totalCost / stock.shares) : 0;

                  return (
                    <div
                      key={stock.id}
                      className={`bulk-trade-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleItem(stock)}
                    >
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <div className="item-info">
                        <div className="item-name">{stock.name}</div>
                        <div className="item-meta">
                          {isBuy ? (
                            <>
                              {formatNumber(stock.shares)} held
                              {geLow ? ` | GE: ${formatNumber(geLow)}` : ''}
                              {geHigh ? ` / ${formatNumber(geHigh)}` : ''}
                            </>
                          ) : (
                            <>{formatNumber(stock.shares)} held | Avg: {formatNumber(avgBuy)}</>
                          )}
                        </div>
                      </div>
                      {isSelected && <span className="item-check">&#10003;</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            {filteredGroups.length === 0 && (
              <div className="bulk-trade-empty-config">{emptyPickerText}</div>
            )}
          </div>
        </div>

        {/* Right: Config */}
        <div className="bulk-trade-config">
          <div className="bulk-trade-config-header">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </div>

          {isBuy && buyMode === 'budgetSplit' && (
            <div className="bulk-trade-budget-row">
              <label>Total Budget (GP)</label>
              <StepInput
                type="text"
                value={budget}
                onChange={(e) => handleMKInput(e.target.value, setBudget)}
                onStep={(d) => setBudget(prev => Math.max(0, (parseFloat(prev) || 0) + d).toString())}
                placeholder="e.g. 100m"
              />
            </div>
          )}

          {selectedCount === 0 ? (
            <div className="bulk-trade-empty-config">{emptyConfigText}</div>
          ) : (
            <div className="bulk-trade-selected-list">
              {selectedEntries.map(([id, item]) => {
                const { stock } = item;
                const iconUrl = stock.itemId ? geIconMap[stock.itemId] : null;
                const geLow = stock.itemId ? gePrices[stock.itemId]?.low : null;
                const geHigh = stock.itemId ? gePrices[stock.itemId]?.high : null;
                const allocation = budgetCalc?.allocations[id];
                const calc = sellCalc.perItem[id];
                const sharesNum = parseFloat(item.shares) || 0;
                const priceNum = parseFloat(item.price) || 0;
                const overMax = !isBuy && sharesNum > stock.shares;

                return (
                  <div key={id} className="bulk-trade-selected-item">
                    <div className="item-header">
                      {iconUrl && <img className="item-icon" src={iconUrl} alt="" />}
                      <span className="item-name">{stock.name}</span>
                      {!isBuy && (
                        <span className="item-held">{formatNumber(stock.shares)} held</span>
                      )}
                      <button className="remove-btn" onClick={() => removeItem(stock.id)}>&times;</button>
                    </div>

                    {/* Inputs */}
                    {isBuy && buyMode === 'perItem' && (
                      <div className="item-inputs">
                        <StepInput
                          type="text"
                          value={item.shares}
                          onChange={(e) => handleSharesInput(id, e.target.value)}
                          onStep={(d) => updateItem(id, 'shares', Math.max(0, (parseFloat(item.shares) || 0) + d).toString())}
                          placeholder="Quantity"
                        />
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(e) => handlePriceInput(id, e.target.value)}
                          onStep={(d) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + d).toString())}
                          placeholder="Price"
                        />
                      </div>
                    )}

                    {isBuy && buyMode === 'budgetSplit' && (
                      <div className="item-inputs">
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(e) => handlePriceInput(id, e.target.value)}
                          onStep={(d) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + d).toString())}
                          placeholder="Buy price"
                        />
                      </div>
                    )}

                    {!isBuy && (
                      <div className="item-inputs">
                        <div className="input-group">
                          <StepInput
                            type="text"
                            value={item.shares}
                            onChange={(e) => handleSharesInput(id, e.target.value)}
                            onStep={(d) => updateItem(id, 'shares', Math.max(0, Math.min(stock.shares, (parseFloat(item.shares) || 0) + d)).toString())}
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
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(e) => handlePriceInput(id, e.target.value)}
                          onStep={(d) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + d).toString())}
                          placeholder="Price"
                        />
                      </div>
                    )}

                    {/* GE shortcut buttons */}
                    {(geLow || geHigh) && (
                      <div className="ge-btns">
                        {geLow && (
                          <button
                            className="bulk-trade-ge-btn low"
                            onClick={() => updateItem(id, 'price', geLow.toString())}
                          >
                            Low: {formatNumber(geLow)}
                          </button>
                        )}
                        {geHigh && (
                          <button
                            className="bulk-trade-ge-btn high"
                            onClick={() => updateItem(id, 'price', geHigh.toString())}
                          >
                            High: {formatNumber(geHigh)}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Buy: per-item subtotal */}
                    {isBuy && buyMode === 'perItem' && perItemTotals.totals[id] > 0 && (
                      <div className="item-subtotal">
                        Total: {formatNumber(perItemTotals.totals[id], 'full')} GP
                      </div>
                    )}

                    {/* Buy: budget allocation info */}
                    {isBuy && buyMode === 'budgetSplit' && (
                      <div className="budget-info">
                        {allocation ? (
                          <div className="shares-calc">
                            {formatNumber(allocation.shares)} qty @ {formatNumber(allocation.price)} = {formatNumber(allocation.spent, 'full')} GP
                          </div>
                        ) : (
                          <div>{parseFloat(item.price) > 0 ? 'Enter budget above' : 'Set a buy price'}</div>
                        )}
                      </div>
                    )}

                    {/* Buy: timer toggle */}
                    {isBuy && (
                      <label className="timer-row">
                        <input
                          type="checkbox"
                          checked={item.startTimer}
                          onChange={(e) => updateItem(id, 'startTimer', e.target.checked)}
                        />
                        Start timer
                      </label>
                    )}

                    {/* Sell: profit preview */}
                    {!isBuy && sharesNum > 0 && priceNum > 0 && calc && (
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

                    {/* Sell: error */}
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

      {/* Footer */}
      <div className="bulk-trade-footer">
        <div className="bulk-trade-footer-stats">
          {isBuy ? (
            <>
              <div className="bulk-trade-total">
                <span className="label">Total: </span>
                <span className="amount">
                  {buyMode === 'perItem'
                    ? formatNumber(perItemTotals.grand, 'full')
                    : formatNumber(budgetCalc?.totalSpent || 0, 'full')
                  } GP
                </span>
              </div>
              {buyMode === 'budgetSplit' && budgetCalc && budgetCalc.remainder > 0 && (
                <div className="bulk-trade-remainder">
                  Remainder: {formatNumber(budgetCalc.remainder, 'full')} GP (cannot be evenly spent)
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bulk-trade-total">
                <span className="label">Revenue: </span>
                <span className="amount">{formatNumber(sellCalc.totalRevenue, 'full')} GP</span>
              </div>
              {selectedCount > 0 && (
                <div className={`bulk-trade-profit ${sellCalc.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                  <span className="label">Profit: </span>
                  <span className="amount">
                    {(sellCalc.totalProfit >= 0 ? '+' : '') + formatNumber(sellCalc.totalProfit, 'full')} GP
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bulk-trade-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
          >
            {isSubmitting
              ? (isBuy ? 'Buying...' : 'Selling...')
              : (isBuy ? `Confirm (${selectedCount})` : `Sell (${selectedCount})`)
            }
          </button>
        </div>
      </div>
    </div>
  );
}
