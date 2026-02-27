import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import StockTable from './StockTable';
import { formatNumber } from '../utils/formatters';

export default function CategorySection({
  category,
  stocks,
  categories,
  isCollapsed,
  onToggleCollapse,
  onAddStock,
  onDeleteCategory,
  onEditCategory,
  onBuy,
  onSell,
  onAdjust,
  onDelete,
  onHistory,
  onNotes,
  onCalculate,
  onDragStart,
  onDragOver,
  onDrop,
  onCategoryDragStart,
  onCategoryDragOver,
  onCategoryDrop,
  highlightedRows,
  sortConfig,
  onSort,
  visibleColumns,
  stockNotes,
  currentTime,
  numberFormat,
  showCategoryStats,
  geData = {},
  geIconMap = {},
  onArchive
}) {
  const categoryStocks = stocks.filter(s => s.category === category);

  return (
    <div className="category-container" data-category={category}>
      <div className="category-header">
        <div
          draggable
          onDragStart={(e) => onCategoryDragStart(e, category)}
          onDragOver={onCategoryDragOver}
          onDrop={(e) => onCategoryDrop(e, category)}
          onClick={() => onToggleCollapse(category)}
          className="category-title"
        >
          <span className={`collapse-icon ${isCollapsed ? 'collapse-icon-rotated' : ''}`}>
            ▼
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgb(96, 165, 250)', margin: 0 }}>
              {category} ({categoryStocks.length})
            </h2>
            {showCategoryStats && (() => {
              const timerCount = categoryStocks.filter(s => s.timerEndTime && s.timerEndTime > Date.now()).length;
              const okCount = categoryStocks.filter(s =>
                (!s.timerEndTime || s.timerEndTime <= Date.now()) &&
                s.shares >= s.needed &&
                !s.onHold
              ).length;
              const holdCount = categoryStocks.filter(s => s.onHold).length;
              const lowCount = categoryStocks.filter(s =>
                (!s.timerEndTime || s.timerEndTime <= Date.now()) &&
                s.shares < s.needed &&
                !s.onHold
              ).length;

              return (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {timerCount > 0 && (
                    <span style={{
                      color: 'rgb(251, 146, 60)',
                      background: 'rgba(251, 146, 60, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(251, 146, 60, 0.3)'
                    }}>
                      ⏰{timerCount}
                    </span>
                  )}
                  {okCount > 0 && (
                    <span style={{
                      color: 'rgb(34, 197, 94)',
                      background: 'rgba(34, 197, 94, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                      ✓{okCount}
                    </span>
                  )}
                  {holdCount > 0 && (
                    <span style={{
                      color: 'rgb(79, 70, 229)',
                      background: 'rgba(79, 70, 229, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(79, 70, 229, 0.3)'
                    }}>
                      🔒{holdCount}
                    </span>
                  )}
                  {lowCount > 0 && (
                    <span style={{
                      color: 'rgb(239, 68, 68)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      🔴{lowCount}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddStock(category);
            }}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'rgb(29, 78, 216)',
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(30, 64, 175)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
          >
            <Plus size={12} /> Add Stock
          </button>
          {category !== 'Uncategorized' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category);
              }}
              className="btn-edit-category"
              title="Edit Category"
            >
              ✏️ Edit
            </button>
          )}
          {category !== 'Uncategorized' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category);
              }}
              className="btn-delete-category"
            >
              <Trash2 size={12} /> Delete Category
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Category Stats Header */}
          <div className="category-stats">
            <StatItem
              label="Total Cost"
              value={formatNumber(categoryStocks.reduce((sum, s) => sum + s.totalCost, 0), numberFormat)}
              color="rgb(96, 165, 250)"
            />
            <StatItem
              label="Total Shares"
              value={formatNumber(categoryStocks.reduce((sum, s) => sum + s.shares, 0), numberFormat)}
              color="rgb(251, 146, 60)"
            />
            <StatItem
              label="Total Profit"
              value={formatNumber(categoryStocks.reduce((sum, s) => sum + (s.totalCostSold - (s.totalCostBasisSold || 0)), 0), numberFormat)}
              color="rgb(52, 211, 153)"
            />
            <StatItem
              label="Sold Shares"
              value={formatNumber(categoryStocks.reduce((sum, s) => sum + s.sharesSold, 0), numberFormat)}
              color="rgb(168, 85, 247)"
            />
            <StatItem
              label="Sold Cost"
              value={formatNumber(categoryStocks.reduce((sum, s) => sum + s.totalCostSold, 0), numberFormat)}
              color="rgb(192, 132, 252)"
            />
          </div>

          <StockTable
            stocks={categoryStocks}
            category={category}
            onBuy={onBuy}
            onSell={onSell}
            onAdjust={onAdjust}
            onDelete={onDelete}
            onHistory={onHistory}
            onNotes={onNotes}
            onCalculate={onCalculate}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            highlightedRows={highlightedRows}
            sortConfig={sortConfig}
            onSort={onSort}
            visibleColumns={visibleColumns}
            stockNotes={stockNotes}
            currentTime={currentTime}
            numberFormat={numberFormat}
            showCategoryStats={showCategoryStats}
            geData={geData}
            geIconMap={geIconMap}
            onArchive={onArchive}
          />
        </>
      )}
    </div>
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