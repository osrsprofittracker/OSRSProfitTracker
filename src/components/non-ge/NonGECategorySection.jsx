import React from 'react';
import { Plus } from 'lucide-react';
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
  onArchive,
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
    <section className="non-ge-category-section" data-category={category.name}>
      <div className="non-ge-category-header">
        <div
          className="non-ge-category-title-wrap"
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
            {category.name} <span>({stocks.length})</span>
          </h2>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddItem(category.id)}>
          <Plus size={12} />
          Add Item
        </button>
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
              color="rgb(96, 165, 250)"
            />
            <StatItem
              label="Total Quantity"
              value={formatNumber(heldQty, numberFormat)}
              color="rgb(251, 146, 60)"
            />
            <StatItem
              label="Total Profit"
              value={`${realizedProfit >= 0 ? '+' : ''}${formatNumber(realizedProfit, numberFormat)}`}
              color={realizedProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
            />
            <StatItem
              label="Sold Quantity"
              value={formatNumber(soldQty, numberFormat)}
              color="rgb(168, 85, 247)"
            />
            <StatItem
              label="Sold Cost"
              value={formatNumber(soldCost, numberFormat)}
              color="rgb(192, 132, 252)"
            />
          </div>

          <NonGETable
            stocks={stocks}
            categoryId={category.id}
            numberFormat={numberFormat}
            sortConfig={sortConfig}
            onSort={onSort}
            onArchive={onArchive}
            onDragStart={onStockDragStart}
            onDragOver={onStockDragOver}
            onDrop={onStockDrop}
          />
        </>
      )}
    </section>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
