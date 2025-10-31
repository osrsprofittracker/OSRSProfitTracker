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
  highlightedRows,
  sortConfig,
  onSort,
  visibleColumns,
  stockNotes,
  currentTime,
  numberFormat
}) {
  const categoryStocks = stocks.filter(s => s.category === category);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.5rem',
        marginBottom: '0.5rem',
        userSelect: 'none'
      }}>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, category)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, category)}
          onClick={() => onToggleCollapse(category)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'move', flex: 1 }}
        >
          <span style={{ 
            fontSize: '1.25rem', 
            transition: 'transform 0.2s', 
            display: 'inline-block', 
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' 
          }}>
            ▼
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgb(96, 165, 250)' }}>
            {category} ({categoryStocks.length})
          </h2>
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
          <button
  onClick={(e) => {
    e.stopPropagation();
    onEditCategory(category);
  }}
  style={{
    padding: '0.25rem 0.75rem',
    background: 'rgb(147, 51, 234)',
    color: 'white',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  }}
  title="Edit Category"
>
  ✏️ Edit
</button>
          {category !== 'Uncategorized' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category);
              }}
              style={{
                padding: '0.25rem 0.75rem',
                background: 'rgb(153, 27, 27)',
                color: 'white',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgb(127, 29, 29)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgb(153, 27, 27)'}
            >
              <Trash2 size={12} /> Delete Category
            </button>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {/* Category Stats Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '1rem',
            background: 'rgba(51, 65, 85, 0.5)',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
            border: '1px solid rgb(71, 85, 105)'
          }}>
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
          />
        </>
      )}
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  );
}