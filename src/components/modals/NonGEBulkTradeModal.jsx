import React, { useMemo, useState } from 'react';
import ItemIcon from '../ItemIcon';
import StepInput from '../StepInput';
import { calculateAvgBuyPrice, calculateCostBasis, calculateSellProfit } from '../../utils/calculations';
import { formatNumber, handleMKInput } from '../../utils/formatters';
import { getNonGECatalogItem, getNonGEWikiImageUrl, nonGEItemDisplayName } from '../../utils/nonGeCatalog';
import '../../styles/bulk-trade-modal.css';

function groupNonGEStocks(stocks, categories, requireShares) {
  const fallbackCategory = categories.find(category => category.name === 'Uncategorized') || categories[0] || null;
  const grouped = new Map(categories.map(category => [category.id, { name: category.name, stocks: [] }]));

  stocks.forEach(stock => {
    if (requireShares && (stock.shares || 0) <= 0) return;

    const categoryId = grouped.has(stock.categoryId) ? stock.categoryId : fallbackCategory?.id;
    if (!categoryId) return;
    grouped.get(categoryId).stocks.push(stock);
  });

  return Array.from(grouped.values()).filter(group => group.stocks.length > 0);
}

export default function NonGEBulkTradeModal({
  mode,
  stocks,
  categories,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) {
  const isBuy = mode === 'buy';
  const [buyMode, setBuyMode] = useState('perItem');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [budget, setBudget] = useState('');

  const groupedStocks = useMemo(
    () => groupNonGEStocks(stocks, categories, !isBuy),
    [categories, isBuy, stocks]
  );

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupedStocks;

    return groupedStocks
      .map(group => ({
        ...group,
        stocks: group.stocks.filter(stock => nonGEItemDisplayName(stock).toLowerCase().includes(q)),
      }))
      .filter(group => group.stocks.length > 0);
  }, [groupedStocks, searchQuery]);

  const toggleItem = (stock) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[stock.id]) {
        delete next[stock.id];
      } else if (isBuy) {
        const avgBuy = calculateAvgBuyPrice(stock);
        const defaultPrice = stock.targetBuyPrice || avgBuy || '';
        next[stock.id] = {
          stock,
          shares: '',
          price: defaultPrice ? defaultPrice.toString() : '',
        };
      } else {
        const avgSell = stock.sharesSold > 0 ? Math.round(stock.totalCostSold / stock.sharesSold) : 0;
        const defaultPrice = stock.targetSellPrice || avgSell || '';
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

  const perItemTotals = useMemo(() => {
    if (!isBuy) return { totals: {}, grand: 0 };

    const totals = {};
    let grand = 0;
    for (const [id, item] of selectedEntries) {
      const shares = parseFloat(item.shares) || 0;
      const price = parseFloat(item.price) || 0;
      const total = shares * price;
      totals[id] = total;
      grand += total;
    }
    return { totals, grand };
  }, [isBuy, selectedItems]);

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
      allocations[id] = { shares, price, allocated: perItem, spent };
      totalSpent += spent;
    }

    return { allocations, remainder: totalBudget - totalSpent, totalSpent };
  }, [budget, buyMode, isBuy, selectedItems, selectedCount]);

  const sellCalc = useMemo(() => {
    if (isBuy) return { perItem: {}, totalRevenue: 0, totalProfit: 0 };

    const perItem = {};
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const [id, item] of selectedEntries) {
      const shares = parseFloat(item.shares) || 0;
      const price = parseFloat(item.price) || 0;
      const revenue = shares * price;
      const costBasis = calculateCostBasis(item.stock, shares);
      const profit = calculateSellProfit(item.stock, shares, price);
      const avgBuy = calculateAvgBuyPrice(item.stock);
      const profitPercent = avgBuy > 0 ? ((price - avgBuy) / avgBuy) * 100 : 0;

      perItem[id] = { revenue, costBasis, profit, profitPercent };
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
          const shares = parseFloat(item.shares);
          const price = parseFloat(item.price);
          return shares > 0 && price > 0;
        });
      }
      return Boolean(budgetCalc && budgetCalc.totalSpent > 0);
    }

    return selectedEntries.every(([, item]) => {
      const shares = parseFloat(item.shares);
      const price = parseFloat(item.price);
      return shares > 0 && price > 0 && shares <= (item.stock.shares || 0);
    });
  }, [budgetCalc, buyMode, isBuy, selectedItems, selectedCount]);

  const handleConfirm = () => {
    if (!canConfirm || isSubmitting) return;

    const items = isBuy && buyMode === 'budgetSplit'
      ? selectedEntries
        .filter(([id]) => budgetCalc?.allocations[id]?.shares > 0)
        .map(([id, item]) => ({
          stock: item.stock,
          shares: budgetCalc.allocations[id].shares,
          price: budgetCalc.allocations[id].price,
        }))
      : selectedEntries.map(([, item]) => ({
        stock: item.stock,
        shares: parseFloat(item.shares),
        price: parseFloat(item.price),
      }));

    onConfirm(items);
  };

  const modeClass = isBuy ? 'mode-buy' : 'mode-sell';
  const emptyPickerText = isBuy ? 'No Non-GE items found' : 'No Non-GE items with holdings found';
  const emptyConfigText = isBuy
    ? 'Select Non-GE items from the left panel to get started'
    : 'Select Non-GE items from the left panel to sell';

  return (
    <div className={`bulk-trade-modal ${modeClass}`}>
      <div className="bulk-trade-header">
        <h2>{isBuy ? 'Bulk Buy Non-GE' : 'Bulk Sell Non-GE'}</h2>
        {isBuy ? (
          <div className="bulk-trade-mode-toggle">
            <button
              type="button"
              className={`bulk-trade-mode-btn ${buyMode === 'perItem' ? 'active' : ''}`}
              onClick={() => setBuyMode('perItem')}
            >
              Per-Item
            </button>
            <button
              type="button"
              className={`bulk-trade-mode-btn ${buyMode === 'budgetSplit' ? 'active' : ''}`}
              onClick={() => setBuyMode('budgetSplit')}
            >
              Budget Split
            </button>
          </div>
        ) : (
          selectedCount > 0 && <span className="bulk-trade-count-badge">{selectedCount}</span>
        )}
      </div>

      <div className="bulk-trade-body">
        <div className="bulk-trade-picker">
          <div className="bulk-trade-search">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="bulk-trade-item-list">
            {filteredGroups.map(group => (
              <React.Fragment key={group.name}>
                <div className="bulk-trade-category-label">{group.name}</div>
                {group.stocks.map(stock => {
                  const isSelected = Boolean(selectedItems[stock.id]);
                  const catalogItem = getNonGECatalogItem(stock.catalogItemKey);
                  const name = nonGEItemDisplayName(stock);
                  const avgBuy = calculateAvgBuyPrice(stock);
                  const targetPrice = isBuy ? stock.targetBuyPrice : stock.targetSellPrice;

                  return (
                    <div
                      key={stock.id}
                      className={`bulk-trade-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleItem(stock)}
                    >
                      <ItemIcon
                        className="item-icon"
                        src={getNonGEWikiImageUrl(catalogItem) || stock.imageUrl}
                        alt=""
                        fallbackText={name}
                      />
                      <div className="item-info">
                        <div className="item-name">{name}</div>
                        <div className="item-meta">
                          {formatNumber(stock.shares || 0)} held
                          {targetPrice ? ` | Target: ${formatNumber(targetPrice)}` : ''}
                          {!isBuy && avgBuy ? ` | Avg: ${formatNumber(avgBuy)}` : ''}
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

        <div className="bulk-trade-config">
          <div className="bulk-trade-config-header">
            <span>{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
          </div>

          {isBuy && buyMode === 'budgetSplit' && (
            <div className="bulk-trade-budget-row">
              <label>Total Budget (GP)</label>
              <StepInput
                type="text"
                value={budget}
                onChange={(event) => handleMKInput(event.target.value, setBudget)}
                onStep={(delta) => setBudget(prev => Math.max(0, (parseFloat(prev) || 0) + delta).toString())}
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
                const catalogItem = getNonGECatalogItem(stock.catalogItemKey);
                const name = nonGEItemDisplayName(stock);
                const allocation = budgetCalc?.allocations[id];
                const calc = sellCalc.perItem[id];
                const sharesNum = parseFloat(item.shares) || 0;
                const priceNum = parseFloat(item.price) || 0;
                const overMax = !isBuy && sharesNum > (stock.shares || 0);

                return (
                  <div key={id} className="bulk-trade-selected-item">
                    <div className="item-header">
                      <ItemIcon
                        className="item-icon"
                        src={getNonGEWikiImageUrl(catalogItem) || stock.imageUrl}
                        alt=""
                        fallbackText={name}
                      />
                      <span className="item-name">{name}</span>
                      {!isBuy && (
                        <span className="item-held">{formatNumber(stock.shares || 0)} held</span>
                      )}
                      <button type="button" className="remove-btn" onClick={() => removeItem(stock.id)}>&times;</button>
                    </div>

                    {isBuy && buyMode === 'perItem' && (
                      <div className="item-inputs">
                        <StepInput
                          type="text"
                          value={item.shares}
                          onChange={(event) => handleSharesInput(id, event.target.value)}
                          onStep={(delta) => updateItem(id, 'shares', Math.max(0, (parseFloat(item.shares) || 0) + delta).toString())}
                          placeholder="Quantity"
                        />
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(event) => handlePriceInput(id, event.target.value)}
                          onStep={(delta) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + delta).toString())}
                          placeholder="Price"
                        />
                      </div>
                    )}

                    {isBuy && buyMode === 'budgetSplit' && (
                      <div className="item-inputs">
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(event) => handlePriceInput(id, event.target.value)}
                          onStep={(delta) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + delta).toString())}
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
                            onChange={(event) => handleSharesInput(id, event.target.value)}
                            onStep={(delta) => updateItem(id, 'shares', Math.max(0, Math.min(stock.shares || 0, (parseFloat(item.shares) || 0) + delta)).toString())}
                            placeholder="Qty"
                            className={overMax ? 'input-error' : ''}
                          />
                          <button
                            type="button"
                            className="sell-all-btn"
                            onClick={() => updateItem(id, 'shares', (stock.shares || 0).toString())}
                          >
                            ALL
                          </button>
                        </div>
                        <StepInput
                          type="text"
                          value={item.price}
                          onChange={(event) => handlePriceInput(id, event.target.value)}
                          onStep={(delta) => updateItem(id, 'price', Math.max(0, (parseFloat(item.price) || 0) + delta).toString())}
                          placeholder="Price"
                        />
                      </div>
                    )}

                    {isBuy && buyMode === 'perItem' && perItemTotals.totals[id] > 0 && (
                      <div className="item-subtotal">
                        Total: {formatNumber(perItemTotals.totals[id], 'full')} GP
                      </div>
                    )}

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

                    {overMax && (
                      <div className="item-error">
                        Exceeds available ({formatNumber(stock.shares || 0)})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            type="button"
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
