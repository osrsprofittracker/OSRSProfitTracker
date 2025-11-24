import React from 'react';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { formatNumber, formatTimer } from '../utils/formatters';
import { calculateAvgBuyPrice, calculateAvgSellPrice, calculateProfit } from '../utils/calculations';
import { sortStocks } from '../utils/calculations';

export default function StockTable({
  stocks,
  category,
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
  const sortedStocks = sortStocks(stocks, sortConfig);

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      border: '1px solid rgb(51, 65, 85)',
      borderRadius: '0.5rem',
      overflowX: 'auto',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <table style={{ width: '100%', fontSize: '0.875rem', color: 'rgb(229, 231, 235)', borderCollapse: 'collapse' }}>
        <TableHeader
          sortConfig={sortConfig}
          onSort={onSort}
          visibleColumns={visibleColumns}
        />
        <tbody>
          {sortedStocks.map((stock, index) => (
            <StockRow
              key={stock.id}
              stock={stock}
              index={index}
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
              isHighlighted={highlightedRows[stock.id]}
              visibleColumns={visibleColumns}
              stockNotes={stockNotes}
              currentTime={currentTime}
              numberFormat={numberFormat}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeader({ sortConfig, onSort, visibleColumns }) {
  const columns = [
    { label: 'Name', key: 'name', visible: true },
    { label: 'Status', key: null, visible: visibleColumns.status },
    { label: 'In Stock', key: 'shares', visible: true },
    { label: 'Total Cost', key: 'totalCost', visible: true },
    { label: 'Avg Buy', key: 'avgBuy', visible: visibleColumns.avgBuy },
    { label: 'Stock Sold', key: 'sharesSold', visible: true },
    { label: 'Total Sold Price', key: 'totalCostSold', visible: true },
    { label: 'Avg Sell', key: 'avgSell', visible: visibleColumns.avgSell },
    { label: 'Profit', key: 'profit', visible: visibleColumns.profit },
    { label: 'Desired Stock', key: 'needed', visible: true },
    { label: '4H Limit', key: 'limit4h', visible: visibleColumns.limit4h },
    { label: 'Timer', key: 'timer', visible: visibleColumns.timer },
    { label: 'Notes', key: null, visible: visibleColumns.notes },
    { label: 'Actions', key: null, visible: true }
  ];

  return (
    <thead style={{ background: 'rgb(30, 41, 59)', borderBottom: '1px solid rgb(51, 65, 85)' }}>
      <tr>
        <th style={{ padding: '0.5rem', width: '2rem', border: '1px solid rgb(51, 65, 85)' }}></th>
        {columns.filter(col => col.visible).map((col) => (
          <th
            key={col.label}
            onClick={() => col.key && onSort(col.key)}
            style={{
              padding: '0.5rem 0.75rem',
              textAlign: 'left',
              fontWeight: '600',
              color: 'rgb(209, 213, 219)',
              border: '1px solid rgb(51, 65, 85)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: col.key ? 'pointer' : 'default',
              userSelect: 'none',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              if (col.key) e.currentTarget.style.background = 'rgb(51, 65, 85)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {col.label}
              {col.key && sortConfig.key === col.key && (
                <span style={{ fontSize: '0.75rem' }}>
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function StockRow({
  stock,
  index,
  category,
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
  isHighlighted,
  visibleColumns,
  stockNotes,
  currentTime,
  numberFormat
}) {
  const avgBuy = calculateAvgBuyPrice(stock);
  const avgSell = calculateAvgSellPrice(stock);
  const profit = calculateProfit(stock);
  const timerDisplay = formatTimer(stock.timerEndTime);
  const isTimerActive = stock.timerEndTime && stock.timerEndTime > Date.now();

  return (
    <tr
      style={{
        background: isHighlighted
          ? 'rgba(96, 165, 250, 0.3)'
          : (index % 2 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.4)'),
        cursor: 'move',
        transition: 'background 0.3s',
        boxShadow: isHighlighted ? '0 0 20px rgba(96, 165, 250, 0.5)' : 'none'
      }}
      draggable
      onDragStart={(e) => onDragStart(e, stock.id, category)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stock.id, category)}
      onMouseOver={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)';
        }
      }}
      onMouseOut={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.background = index % 2 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.4)';
        }
      }}
    >
      <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
        <GripVertical size={16} style={{ color: 'rgb(107, 114, 128)', margin: '0 auto' }} />
      </td>
      <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: 'white', border: '1px solid rgb(51, 65, 85)' }}>
        {stock.name}
      </td>
      {visibleColumns.status && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
          <StatusBadge stock={stock} />
        </td>
      )}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.shares, numberFormat)}
      </td>
      <td style={{ padding: '0.5rem 0.5rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)', whiteSpace: 'nowrap' }}>
        {formatNumber(stock.totalCost, numberFormat)}
      </td>
      {visibleColumns.avgBuy && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>
          ${avgBuy.toFixed(2)}
        </td>
      )}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.sharesSold, numberFormat)}
      </td>
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.totalCostSold, numberFormat)}
      </td>
      {visibleColumns.avgSell && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>
          ${avgSell.toFixed(2)}
        </td>
      )}
      {visibleColumns.profit && (
        <td style={{
          padding: '0.5rem 0.75rem',
          textAlign: 'right',
          border: '1px solid rgb(51, 65, 85)',
          color: profit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)',
          whiteSpace: 'nowrap',
          minWidth: '90px'
        }}>
          {profit >= 0 ? '+' : ''}{formatNumber(profit, numberFormat)}
        </td>
      )}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.needed, numberFormat)}
      </td>
      {visibleColumns.limit4h && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
          {formatNumber(stock.limit4h, numberFormat)}
        </td>
      )}
      {visibleColumns.timer && (
        <td style={{
          padding: '0.5rem 0.75rem',
          textAlign: 'center',
          border: '1px solid rgb(51, 65, 85)',
          fontFamily: 'monospace',
          color: isTimerActive ? 'rgb(251, 146, 60)' : 'rgb(156, 163, 175)'
        }}>
          {timerDisplay}
        </td>
      )}
      {visibleColumns.notes && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
          <button
            onClick={() => onNotes(stock)}
            style={{
              padding: '0.25rem 0.75rem',
              background: stockNotes[stock.id] ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: '0.25rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = stockNotes[stock.id] ? 'rgb(147, 51, 234)' : 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = stockNotes[stock.id] ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)'}
          >
            {stockNotes[stock.id] ? '📝 Edit' : '➕ Add'}
          </button>
        </td>
      )}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
        <ActionButtons
          stock={stock}
          onBuy={onBuy}
          onSell={onSell}
          onHistory={onHistory}
          onAdjust={onAdjust}
          onDelete={onDelete}
          onCalculate={onCalculate}
        />
      </td>
    </tr>
  );
}

function StatusBadge({ stock }) {
  if (stock.timerEndTime && stock.timerEndTime > Date.now()) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        background: 'rgb(202, 138, 4)',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}>
        <span>⏰</span>
        <span>TIMER</span>
      </span>
    );
  } else if (stock.shares < stock.needed) {
    //Check if on hold first
    if (stock.onHold) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: 'rgb(79, 70, 229)',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          <span>🔒</span>
          <span>ON HOLD</span>
        </span>
      );
    }
    
    // Otherwise show LOW
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        background: 'rgb(220, 38, 38)',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}>
        <span>🔴</span>
        <span>LOW</span>
      </span>
    );
  } else {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        background: 'rgb(21, 128, 61)',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}>
        <span>🟢</span>
        <span>OK</span>
      </span>
    );
  }
}

function ActionButtons({ stock, onBuy, onSell, onHistory, onAdjust, onDelete, onCalculate }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
      <button
        onClick={() => onBuy(stock)}
        style={{
          padding: '0.25rem 0.75rem',
          background: 'rgb(21, 128, 61)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
      >
        Buy
      </button>
      <button
        onClick={() => onSell(stock)}
        style={{
          padding: '0.25rem 0.75rem',
          background: 'rgb(185, 28, 28)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(153, 27, 27)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
      >
        Sell
      </button>
      <button
        onClick={() => onHistory(stock)}
        style={{
          padding: '0.25rem 0.75rem',
          background: 'rgb(67, 56, 202)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(55, 48, 163)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
      >
        📜
      </button>
      <button
        onClick={() => onCalculate(stock)}
        style={{
          padding: '0.375rem 0.75rem',
          background: 'rgb(59, 130, 246)',
          color: 'white',
          borderRadius: '0.375rem',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}
        title="Calculate time to target"
      >
        ⏱️ Calc
      </button>
      <button
        onClick={() => onAdjust(stock)}
        style={{
          padding: '0.25rem 0.75rem',
          background: 'rgb(202, 138, 4)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(202, 138, 4)'}
      >
        <Edit3 size={12} /> Adjust
      </button>
      <button
        onClick={() => onDelete(stock)}
        style={{
          padding: '0.25rem 0.75rem',
          background: 'rgb(127, 29, 29)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(69, 10, 10)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(127, 29, 29)'}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}