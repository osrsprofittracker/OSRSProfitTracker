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
}) {
  const totalCost = stocks.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
  const heldQty = stocks.reduce((sum, stock) => sum + (stock.shares || 0), 0);
  const realizedProfit = stocks.reduce((sum, stock) => sum + calculateProfit(stock), 0);

  return (
    <section className="non-ge-category-section" data-category={category.name}>
      <div className="non-ge-category-header">
        <div>
          <h2 className="non-ge-category-title">
            {category.name} <span>({stocks.length})</span>
          </h2>
          <div className="non-ge-category-stats">
            <span>Total Cost: {formatNumber(totalCost, numberFormat)}</span>
            <span>Held Qty: {formatNumber(heldQty, numberFormat)}</span>
            <span>Profit: {realizedProfit >= 0 ? '+' : ''}{formatNumber(realizedProfit, numberFormat)}</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddItem(category.id)}>
          <Plus size={12} />
          Add Item
        </button>
      </div>

      <NonGETable
        stocks={stocks}
        numberFormat={numberFormat}
        sortConfig={sortConfig}
        onSort={onSort}
        onArchive={onArchive}
      />
    </section>
  );
}
