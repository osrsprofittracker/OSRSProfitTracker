import React from 'react';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { formatNumber, formatTimer, formatAvgPrice } from '../utils/formatters';
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
    <div className="table-container">
      <table className="table-base">
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
    { label: 'Desired Stock', key: 'needed', visible: visibleColumns.desiredStock },
    { label: '4H Limit', key: 'limit4h', visible: visibleColumns.limit4h },
    { label: 'Timer', key: 'timer', visible: visibleColumns.timer },
    { label: 'Notes', key: null, visible: visibleColumns.notes },
    { label: 'Actions', key: null, visible: true }
  ];

  return (
    <thead className="thead-base">
      <tr>
        <th className="th-icon-empty"></th>
        {columns.filter(col => col.visible).map((col) => (
          <th
            key={col.label}
            onClick={() => col.key && onSort(col.key)}
            className={`th-base ${col.key ? 'th-sortable' : ''}`}
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
      className={`tr-base ${isHighlighted ? 'tr-highlighted' : (index % 2 ? 'tr-even' : 'tr-odd')}`}
      draggable
      onDragStart={(e) => onDragStart(e, stock.id, category)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stock.id, category)}
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
          {formatAvgPrice(avgBuy, numberFormat)}
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
          {formatAvgPrice(avgSell, numberFormat)}
        </td>
      )}
      {visibleColumns.profit && (
        <td className={`td-base td-right ${profit >= 0 ? 'td-profit-positive' : 'td-profit-negative'}`}>
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
        <td className={`td-base td-center td-timer ${isTimerActive ? 'td-timer-active' : 'td-timer-inactive'}`}>
          {timerDisplay}
        </td>
      )}
      {visibleColumns.notes && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
          <button
            onClick={() => onNotes(stock)}
            className={`btn btn-sm ${stockNotes[stock.id] ? 'btn-purple' : 'btn-secondary'}`}
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
      <span className="badge badge-timer">
        <span>⏰</span>
        <span>TIMER</span>
      </span>
    );
  } else if (stock.shares < stock.needed) {
    if (stock.onHold) {
      return (
        <span className="badge badge-hold">
          <span>🔒</span>
          <span>ON HOLD</span>
        </span>
      );
    }

    return (
      <span className="badge badge-low">
        <span>🔴</span>
        <span>LOW</span>
      </span>
    );
  } else {
    return (
      <span className="badge badge-ok">
        <span>🟢</span>
        <span>OK</span>
      </span>
    );
  }
}

function ActionButtons({ stock, onBuy, onSell, onHistory, onAdjust, onDelete, onCalculate }) {
  return (
    <div className="action-buttons">
      <button className="btn btn-success btn-sm" onClick={() => onBuy(stock)}>
        Buy
      </button>
      <button className="btn btn-sell btn-sm" onClick={() => onSell(stock)}>
        Sell
      </button>
      <button className="btn btn-info btn-sm" onClick={() => onHistory(stock)}>
        📜
      </button>
      <button className="btn btn-blue btn-sm" onClick={() => onCalculate(stock)}>
        ⏱️ Calc
      </button>
      <button className="btn btn-warning btn-sm" onClick={() => onAdjust(stock)}>
        Adjust
      </button>
      <button className="btn btn-danger btn-sm" onClick={() => onDelete(stock)}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}
