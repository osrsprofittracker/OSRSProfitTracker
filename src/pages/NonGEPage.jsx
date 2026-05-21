import React, { useMemo, useState } from 'react';
import { Archive, Boxes, FolderPlus, Package, PackagePlus, Plus, ShoppingCart, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import NonGECategorySection from '../components/non-ge/NonGECategorySection';
import { calculateProfit } from '../utils/calculations';
import { formatNumber } from '../utils/formatters';
import '../styles/trade-status-strip.css';
import '../styles/non-ge-page.css';

function NonGEStatusItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="trade-status-item">
      <div className="trade-status-icon">
        <Icon size={16} />
      </div>
      <div className="trade-status-copy">
        <span className="trade-status-label">{label}</span>
        <span className={`trade-status-value ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}

export default function NonGEPage({
  stocks,
  categories,
  loading,
  numberFormat,
  sortConfig,
  onSort,
  onAddCategory,
  onAddItem,
  onEditCategory,
  onDeleteCategory,
  onBulkAdd,
  onBulkBuy,
  onBulkSell,
  onArchiveOpen,
  onArchive,
  onArchiveRequest,
  onReorderCategory,
  onReorderStock,
  onMoveStock,
  onBuy,
  onSell,
  onRemove,
  onAdjust,
  onNotes,
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const summary = useMemo(() => {
    return stocks.reduce(
      (acc, stock) => ({
        activeItems: acc.activeItems + 1,
        heldQty: acc.heldQty + (stock.shares || 0),
        totalCost: acc.totalCost + (stock.totalCost || 0),
        realizedProfit: acc.realizedProfit + calculateProfit(stock),
      }),
      { activeItems: 0, heldQty: 0, totalCost: 0, realizedProfit: 0 }
    );
  }, [stocks]);

  const groupedStocks = useMemo(() => {
    const groups = new Map(categories.map(category => [category.id, []]));
    const fallbackCategory = categories.find(category => category.name === 'Uncategorized') || categories[0] || null;

    stocks.forEach(stock => {
      const categoryId = groups.has(stock.categoryId) ? stock.categoryId : fallbackCategory?.id;
      if (!categoryId) return;
      groups.get(categoryId).push(stock);
    });

    return groups;
  }, [stocks, categories]);

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleCategoryDragStart = (event, categoryId) => {
    event.dataTransfer.setData('nonGECategoryId', categoryId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDrop = async (event, targetCategoryId) => {
    event.preventDefault();
    const draggedCategoryId = event.dataTransfer.getData('nonGECategoryId');
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) return;

    const targetIndex = categories.findIndex(category => category.id === targetCategoryId);
    if (targetIndex === -1) return;

    await onReorderCategory(draggedCategoryId, targetIndex);
  };

  const handleStockDragStart = (event, stock, sourceCategoryId) => {
    event.dataTransfer.setData('nonGEStockId', stock.id);
    event.dataTransfer.setData('nonGESourceCategoryId', sourceCategoryId || '');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleStockDrop = async (event, targetStock, targetCategoryId) => {
    event.preventDefault();
    event.stopPropagation();

    const draggedStockId = event.dataTransfer.getData('nonGEStockId');
    const sourceCategoryId = event.dataTransfer.getData('nonGESourceCategoryId') || null;
    if (!draggedStockId || draggedStockId === targetStock?.id) return;

    if (sourceCategoryId === targetCategoryId && targetStock?.id) {
      await onReorderStock(draggedStockId, targetStock.id, targetCategoryId);
      return;
    }

    await onMoveStock(draggedStockId, targetCategoryId);
  };

  const handleCategoryStockDrop = async (event, targetCategoryId) => {
    event.preventDefault();
    const draggedStockId = event.dataTransfer.getData('nonGEStockId');
    if (!draggedStockId) return;

    await onMoveStock(draggedStockId, targetCategoryId);
  };

  return (
    <div className="non-ge-page">
      <section className="trade-status-overview" aria-label="Non-GE overview">
        <div className="trade-status-strip">
          <NonGEStatusItem
            icon={Package}
            label="Active Items"
            value={formatNumber(summary.activeItems, 'full')}
          />
          <NonGEStatusItem
            icon={Boxes}
            label="Held Qty"
            value={formatNumber(summary.heldQty, numberFormat)}
          />
          <NonGEStatusItem
            icon={Wallet}
            label="Total Cost"
            value={formatNumber(summary.totalCost, numberFormat)}
          />
          <NonGEStatusItem
            icon={TrendingUp}
            label="Realized Profit"
            value={`${summary.realizedProfit >= 0 ? '+' : ''}${formatNumber(summary.realizedProfit, numberFormat)}`}
            valueClass={summary.realizedProfit >= 0 ? 'positive' : 'negative'}
          />
        </div>

        <div className="trade-status-companion-row non-ge-status-companion-row">
          <div className="trade-quick-actions" aria-label="Non-GE quick actions">
            <div className="trade-quick-actions-header">
              <span className="trade-quick-actions-title">Quick Actions</span>
            </div>
            <div className="trade-quick-actions-grid">
              <div className="trade-quick-action-group">
                <button
                  type="button"
                  className="trade-quick-action-btn is-category"
                  onClick={onAddCategory}
                >
                  <FolderPlus size={14} />
                  Add Category
                </button>
                <button
                  type="button"
                  className="trade-quick-action-btn is-item"
                  onClick={() => onAddItem()}
                >
                  <Plus size={14} />
                  Add Item
                </button>
              </div>
              <div className="trade-quick-action-group">
                <button
                  type="button"
                  className="trade-quick-action-btn is-item"
                  onClick={onBulkAdd}
                >
                  <PackagePlus size={14} />
                  Bulk Add
                </button>
                <button
                  type="button"
                  className="trade-quick-action-btn is-success"
                  onClick={onBulkBuy}
                >
                  <ShoppingCart size={14} />
                  Bulk Buy
                </button>
                <button
                  type="button"
                  className="trade-quick-action-btn is-danger"
                  onClick={onBulkSell}
                >
                  <TrendingDown size={14} />
                  Bulk Sell
                </button>
              </div>
              <div className="trade-quick-action-group trade-quick-action-group-archive">
                <button
                  type="button"
                  className="trade-quick-action-btn"
                  onClick={onArchiveOpen}
                >
                  <Archive size={14} />
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="non-ge-page-empty">Loading Non-GE items...</div>
      ) : categories.length === 0 ? (
        <div className="non-ge-page-empty">No Non-GE categories found.</div>
      ) : stocks.length === 0 ? (
        <div className="non-ge-page-empty">
          <Boxes size={24} />
          <span>No active Non-GE items yet.</span>
        </div>
      ) : (
        categories.map(category => (
          <NonGECategorySection
            key={category.id}
            category={category}
            stocks={groupedStocks.get(category.id) || []}
            numberFormat={numberFormat}
            sortConfig={sortConfig}
            onSort={onSort}
            onAddItem={onAddItem}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onArchive={onArchiveRequest || onArchive}
            onBuy={onBuy}
            onSell={onSell}
            onRemove={onRemove}
            onAdjust={onAdjust}
            onNotes={onNotes}
            isCollapsed={Boolean(collapsedCategories[category.id])}
            onToggleCollapse={() => toggleCategory(category.id)}
            onCategoryDragStart={handleCategoryDragStart}
            onCategoryDragOver={(event) => event.preventDefault()}
            onCategoryDrop={handleCategoryDrop}
            onStockDragStart={handleStockDragStart}
            onStockDragOver={(event) => event.preventDefault()}
            onStockDrop={handleStockDrop}
            onCategoryStockDrop={handleCategoryStockDrop}
          />
        ))
      )}
    </div>
  );
}
