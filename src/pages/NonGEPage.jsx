import React, { useMemo } from 'react';
import { Archive, Boxes, PackagePlus, Plus } from 'lucide-react';
import NonGECategorySection from '../components/non-ge/NonGECategorySection';
import { calculateProfit } from '../utils/calculations';
import { formatNumber } from '../utils/formatters';
import '../styles/non-ge-page.css';

function SummaryCard({ label, value }) {
  return (
    <div className="non-ge-summary-card">
      <div className="non-ge-summary-label">{label}</div>
      <div className="non-ge-summary-value">{value}</div>
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
  onAddItem,
  onBulkAdd,
  onArchiveOpen,
  onArchive,
}) {
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

  return (
    <div className="non-ge-page">
      <div className="non-ge-page-header">
        <div>
          <h1 className="non-ge-page-title">Non-GE Tracker</h1>
          <p className="non-ge-page-subtitle">Track fixed catalog and private collector items outside Grand Exchange pricing.</p>
        </div>
        <div className="non-ge-page-actions">
          <button type="button" className="btn btn-success" onClick={() => onAddItem()}>
            <Plus size={16} />
            Add Item
          </button>
          <button type="button" className="btn btn-primary" onClick={onBulkAdd}>
            <PackagePlus size={16} />
            Bulk Add
          </button>
          <button type="button" className="btn btn-secondary" onClick={onArchiveOpen}>
            <Archive size={16} />
            Archive
          </button>
        </div>
      </div>

      <div className="non-ge-summary-grid">
        <SummaryCard label="Active Items" value={formatNumber(summary.activeItems, 'full')} />
        <SummaryCard label="Held Qty" value={formatNumber(summary.heldQty, numberFormat)} />
        <SummaryCard label="Total Cost" value={formatNumber(summary.totalCost, numberFormat)} />
        <SummaryCard
          label="Realized Profit"
          value={`${summary.realizedProfit >= 0 ? '+' : ''}${formatNumber(summary.realizedProfit, numberFormat)}`}
        />
      </div>

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
            onArchive={onArchive}
          />
        ))
      )}
    </div>
  );
}
