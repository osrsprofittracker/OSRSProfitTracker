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

function NonGECategorySnapshot({ categories, segments }) {
  return (
    <div className="trade-quick-actions non-ge-category-snapshot" aria-label="Non-GE category snapshot">
      <div className="trade-quick-actions-header">
        <span className="trade-quick-actions-title">Category Snapshot</span>
      </div>
      {categories.length > 0 ? (
        <div className="non-ge-category-snapshot-list">
          <div className="non-ge-category-snapshot-heading">
            <span
              className="non-ge-category-snapshot-tooltip"
              data-tooltip="Category name and item, held, and sold counts."
              tabIndex={0}
            >
              Category
            </span>
            <div className="non-ge-category-snapshot-heading-values">
              <span
                className="non-ge-category-snapshot-tooltip"
                data-tooltip="Current total cost basis for held items in this category."
                tabIndex={0}
              >
                Cost
              </span>
              <span
                className="non-ge-category-snapshot-tooltip"
                data-tooltip="All-time realized profit from sold items in this category."
                tabIndex={0}
              >
                Profit
              </span>
              <span
                className="non-ge-category-snapshot-tooltip"
                data-tooltip="This category's percentage of total Non-GE cost."
                tabIndex={0}
              >
                Share
              </span>
            </div>
          </div>
          {categories.map(category => (
            <div key={category.id} className={`non-ge-category-snapshot-row ${category.colorClass}`}>
              <div className="non-ge-category-snapshot-main">
                <span className="non-ge-category-snapshot-name">
                  <span className={`non-ge-category-snapshot-swatch ${category.colorClass}`} aria-hidden="true" />
                  {category.name}
                </span>
                <span className="non-ge-category-snapshot-meta">
                  {category.itemCount} item{category.itemCount === 1 ? '' : 's'} / {category.heldQtyLabel} held / {category.soldQtyLabel} sold
                </span>
              </div>
              <div className="non-ge-category-snapshot-values">
                <span className="non-ge-category-snapshot-value">{category.totalCostLabel}</span>
                <span className={`non-ge-category-snapshot-profit ${category.realizedProfit >= 0 ? 'positive' : 'negative'}`}>
                  {category.realizedProfitLabel}
                </span>
                <span className="non-ge-category-snapshot-share">{category.costShareLabel}</span>
              </div>
            </div>
          ))}
          {segments.length > 0 && (
            <div className="non-ge-category-allocation">
              <div className="non-ge-category-allocation-header">
                <span>Cost allocation</span>
                <span>Top 3 + other</span>
              </div>
              <svg
                className="non-ge-category-allocation-bar"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                role="img"
                aria-label="Non-GE cost allocation by category"
              >
                <rect className="non-ge-category-allocation-bg" x="0" y="0" width="100" height="8" rx="4" />
                {segments.map(segment => (
                  <rect
                    key={segment.id}
                    className={`non-ge-category-allocation-segment ${segment.colorClass}`}
                    x={segment.offset}
                    y="0"
                    width={segment.width}
                    height="8"
                  >
                    <title>{segment.label}</title>
                  </rect>
                ))}
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="non-ge-category-snapshot-empty">No category data yet</div>
      )}
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

  const categorySnapshot = useMemo(() => {
    const rankedCategories = categories
      .map(category => {
        const categoryStocks = groupedStocks.get(category.id) || [];
        const totalCost = categoryStocks.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
        const heldQty = categoryStocks.reduce((sum, stock) => sum + (stock.shares || 0), 0);
        const soldQty = categoryStocks.reduce((sum, stock) => sum + (stock.sharesSold || 0), 0);
        const realizedProfit = categoryStocks.reduce((sum, stock) => sum + calculateProfit(stock), 0);
        const costShare = summary.totalCost > 0 ? (totalCost / summary.totalCost) * 100 : 0;

        return {
          id: category.id,
          name: category.name,
          itemCount: categoryStocks.length,
          totalCost,
          realizedProfit,
          costShare,
          totalCostLabel: formatNumber(totalCost, numberFormat),
          heldQtyLabel: formatNumber(heldQty, numberFormat),
          soldQtyLabel: formatNumber(soldQty, numberFormat),
          realizedProfitLabel: `${realizedProfit >= 0 ? '+' : ''}${formatNumber(realizedProfit, numberFormat)}`,
          costShareLabel: `${costShare.toFixed(1)}% of cost`,
        };
      })
      .filter(category => category.itemCount > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    const visibleCategories = rankedCategories.slice(0, 3).map((category, index) => ({
      ...category,
      colorClass: `is-snapshot-${index + 1}`,
    }));

    let offset = 0;
    const visibleSegments = summary.totalCost > 0
      ? visibleCategories
          .filter(category => category.costShare > 0)
          .map(category => {
            const segment = {
              id: category.id,
              width: Number(category.costShare.toFixed(2)),
              offset: Number(offset.toFixed(2)),
              colorClass: category.colorClass,
              label: `${category.name}: ${category.costShare.toFixed(1)}% of Non-GE cost`,
            };
            offset += category.costShare;
            return segment;
          })
      : [];

    const otherShare = summary.totalCost > 0 ? Math.max(0, 100 - offset) : 0;
    const otherSegment = otherShare > 0.05
      ? [{
        id: 'other',
        width: Number(otherShare.toFixed(2)),
        offset: Number(offset.toFixed(2)),
        colorClass: 'is-snapshot-other',
        label: `Other categories: ${otherShare.toFixed(1)}% of Non-GE cost`,
      }]
      : [];

    return {
      categories: visibleCategories,
      segments: [...visibleSegments, ...otherSegment],
    };
  }, [categories, groupedStocks, numberFormat, summary.totalCost]);

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
          <NonGECategorySnapshot categories={categorySnapshot.categories} segments={categorySnapshot.segments} />
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
