import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { calculateProfit } from '../../utils/calculations';
import { formatNumber } from '../../utils/formatters';
import NonGETable from './NonGETable';

export default function NonGECategorySection({
  category,
  stocks,
  numberFormat,
  sortConfig,
  onSort,
  onAddItem,
  onEditCategory,
  onDeleteCategory,
  onArchive,
  onBuy,
  onSell,
  onRemove,
  onAdjust,
  onNotes,
  isCollapsed,
  onToggleCollapse,
  onCategoryDragStart,
  onCategoryDragOver,
  onCategoryDrop,
  onStockDragStart,
  onStockDragOver,
  onStockDrop,
  onCategoryStockDrop,
}) {
  const totalCost = stocks.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
  const heldQty = stocks.reduce((sum, stock) => sum + (stock.shares || 0), 0);
  const soldQty = stocks.reduce((sum, stock) => sum + (stock.sharesSold || 0), 0);
  const soldCost = stocks.reduce((sum, stock) => sum + (stock.totalCostSold || 0), 0);
  const realizedProfit = stocks.reduce((sum, stock) => sum + calculateProfit(stock), 0);

  return (
    <section className="category-container non-ge-category-section" data-category={category.name}>
      <div className="category-header">
        <div
          className="category-title"
          draggable
          onDragStart={(event) => onCategoryDragStart(event, category.id)}
          onDragOver={onCategoryDragOver}
          onDrop={(event) => onCategoryDrop(event, category.id)}
          onClick={onToggleCollapse}
        >
          <span className={`collapse-icon ${isCollapsed ? 'collapse-icon-rotated' : ''}`}>
            ▼
          </span>
          <h2 className="non-ge-category-title">
            {category.name} ({stocks.length})
          </h2>
        </div>
        <div className="non-ge-category-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddItem(category.id)}>
            <Plus size={12} />
            Add Item
          </button>
          {category.name !== 'Uncategorized' && (
            <button
              type="button"
              className="btn-edit-category"
              title="Edit Category"
              onClick={(event) => {
                event.stopPropagation();
                onEditCategory(category);
              }}
            >
              Edit
            </button>
          )}
          {category.name !== 'Uncategorized' && (
            <button
              type="button"
              className="btn-delete-category"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteCategory(category);
              }}
            >
              <Trash2 size={12} />
              Delete Category
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div
            className="category-stats non-ge-category-stats-band"
            onDragOver={onStockDragOver}
            onDrop={(event) => onCategoryStockDrop(event, category.id)}
          >
            <StatItem
              label="Total Cost"
              value={formatNumber(totalCost, numberFormat)}
              tone="cost"
            />
            <StatItem
              label="Total Quantity"
              value={formatNumber(heldQty, numberFormat)}
              tone="quantity"
            />
            <StatItem
              label="Total Profit"
              value={`${realizedProfit >= 0 ? '+' : ''}${formatNumber(realizedProfit, numberFormat)}`}
              tone={realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'}
            />
            <StatItem
              label="Sold Quantity"
              value={formatNumber(soldQty, numberFormat)}
              tone="sold-quantity"
            />
            <StatItem
              label="Sold Cost"
              value={formatNumber(soldCost, numberFormat)}
              tone="sold-cost"
            />
          </div>

          <NonGETable
            stocks={stocks}
            categoryId={category.id}
            numberFormat={numberFormat}
            sortConfig={sortConfig}
            onSort={onSort}
            onArchive={onArchive}
            onBuy={onBuy}
            onSell={onSell}
            onRemove={onRemove}
            onAdjust={onAdjust}
            onNotes={onNotes}
            onDragStart={onStockDragStart}
            onDragOver={onStockDragOver}
            onDrop={onStockDrop}
          />
        </>
      )}
    </section>
  );
}

function StatItem({ label, value, tone }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className={`stat-value non-ge-stat-value--${tone}`}>{value}</div>
    </div>
  );
}
