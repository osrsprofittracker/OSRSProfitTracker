import React from 'react';
import { Edit3, Trash2, GripVertical, Star, Bell, BellRing } from 'lucide-react';
import { formatNumber, formatTimer, formatAvgPrice } from '../utils/formatters';
import { calculateAvgBuyPrice, calculateAvgSellPrice, calculateProfit } from '../utils/calculations';
import { calculateUnrealizedProfit } from '../utils/taxUtils';
import { sortStocks } from '../utils/calculations';

function investmentAge(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (days > 0) parts.push(`${days}d`);
  return parts.length ? parts.join(' ') : 'Today';
}

export default function StockTable({
  stocks,
  category,
  onBuy,
  onSell,
  onRemove,
  onAdjust,
  onDelete,
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
  numberFormat,
  geData = {},
  geIconMap = {},
  membershipMap = {},
  showMembershipIcon = true,
  onArchive,
  showInvestmentDate = false,
  onInvestmentDateChange,
  onPriceAlert,
  priceAlerts = {},
  onViewGraph,
}) {
  const sortedStocks = sortStocks(stocks, sortConfig);

  return (
    <div className="table-container">
      <table className="table-base">
        <TableHeader
          sortConfig={sortConfig}
          onSort={onSort}
          visibleColumns={visibleColumns}
          showInvestmentDate={showInvestmentDate}
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
              onRemove={onRemove}
              onAdjust={onAdjust}
              onDelete={onDelete}
              onNotes={onNotes}
              onCalculate={onCalculate}
              onArchive={onArchive}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isHighlighted={highlightedRows[stock.id]}
              visibleColumns={visibleColumns}
              stockNotes={stockNotes}
              currentTime={currentTime}
              numberFormat={numberFormat}
              geData={geData}
              geIconMap={geIconMap}
              membershipMap={membershipMap}
              showMembershipIcon={showMembershipIcon}
              showInvestmentDate={showInvestmentDate}
              onInvestmentDateChange={onInvestmentDateChange}
              onPriceAlert={onPriceAlert}
              priceAlerts={priceAlerts}
              onViewGraph={onViewGraph}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeader({ sortConfig, onSort, visibleColumns, showInvestmentDate }) {
  const columns = [
    { label: 'Name', key: 'name', visible: true, tooltip: 'Item name' },
    { label: 'Status', key: null, visible: visibleColumns.status, tooltip: 'Shows if the 4h GE buy limit has reset' },
    { label: 'In Stock', key: 'shares', visible: true, tooltip: 'How many you currently hold' },
    { label: 'Total Cost', key: 'totalCost', visible: true, tooltip: 'Total GP spent buying this item' },
    { label: 'Avg Buy', key: 'avgBuy', visible: visibleColumns.avgBuy, tooltip: 'Average price paid per item' },
    { label: 'Stock Sold', key: 'sharesSold', visible: true, tooltip: 'How many you have sold' },
    { label: 'Total Sold Price', key: 'totalCostSold', visible: true, tooltip: 'Total GP received from sales' },
    { label: 'Avg Sell', key: 'avgSell', visible: visibleColumns.avgSell, tooltip: 'Average sell price per item' },
    { label: 'Profit', key: 'profit', visible: visibleColumns.profit, tooltip: 'Realized profit from sold items' },
    { label: 'Desired Stock', key: 'needed', visible: visibleColumns.desiredStock, tooltip: 'How many you want to hold' },
    { label: '4H Limit', key: 'limit4h', visible: visibleColumns.limit4h, tooltip: 'GE 4-hour buy limit' },
    { label: 'GE High', key: null, visible: visibleColumns.geHigh, tooltip: 'Live GE highest buy price' },
    { label: 'GE Low', key: null, visible: visibleColumns.geLow, tooltip: 'Live GE lowest sell price' },
    { label: 'Unreal. Profit', key: null, visible: visibleColumns.unrealizedProfit, tooltip: 'Estimated profit if sold at GE high (after 2% tax)' },
    { label: 'Start Date', key: null, visible: showInvestmentDate, tooltip: 'Date this investment was started' },
    { label: 'Notes', key: null, visible: visibleColumns.notes, tooltip: 'Your notes for this item' },
    { label: 'Actions', key: null, visible: true, tooltip: 'Buy, sell, adjust, calculate, archive, or delete' }
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
            title={col.tooltip}
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
  onRemove,
  onAdjust,
  onDelete,
  onNotes,
  onCalculate,
  onDragStart,
  onDragOver,
  onDrop,
  isHighlighted,
  visibleColumns,
  stockNotes,
  currentTime,
  numberFormat,
  geData = {},
  geIconMap = {},
  membershipMap = {},
  showMembershipIcon = true,
  onArchive,
  showInvestmentDate,
  onInvestmentDateChange,
  onPriceAlert,
  priceAlerts = {},
  onViewGraph,
}) {
  const avgBuy = calculateAvgBuyPrice(stock);
  const avgSell = calculateAvgSellPrice(stock);
  const profit = calculateProfit(stock);
  const timerDisplay = formatTimer(stock.timerEndTime);
  const isTimerActive = stock.timerEndTime && stock.timerEndTime > Date.now();

  return (
    <tr
      data-stock-id={stock.id}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {stock.itemId && geIconMap[stock.itemId] && (
            <img
              src={geIconMap[stock.itemId]}
              alt=""
              style={{ width: '20px', height: '20px', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          )}
          {showMembershipIcon && stock.itemId && stock.itemId in membershipMap && (
            <Star
              className={`members-star ${membershipMap[stock.itemId] ? 'members-star--p2p' : 'members-star--f2p'}`}
              size={12}
              fill="currentColor"
              title={membershipMap[stock.itemId] ? 'Members item' : 'Free-to-play item'}
            />
          )}
          {stock.itemId && onViewGraph ? (
            <span
              className="stock-name-link"
              onClick={(e) => { e.stopPropagation(); onViewGraph(stock); }}
              title="View price graph"
            >
              {stock.name}
            </span>
          ) : (
            stock.name
          )}
          {stock.itemId && onPriceAlert && (
            <button
              className={`stock-name-bell ${priceAlerts[stock.itemId]?.isActive ? 'stock-name-bell-active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onPriceAlert(stock); }}
              title={priceAlerts[stock.itemId]?.isActive ? 'Edit price alert' : 'Set price alert'}
            >
              {priceAlerts[stock.itemId]?.isActive ? <BellRing size={12} /> : <Bell size={12} />}
            </button>
          )}
        </div>
      </td>
      {visibleColumns.status && (
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
          <StatusBadge stock={stock} />
        </td>
      )}
      <td title={formatNumber(stock.shares, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.shares, numberFormat)}
      </td>
      <td title={formatNumber(stock.totalCost, 'full')} style={{ padding: '0.5rem 0.5rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)', whiteSpace: 'nowrap' }}>
        {formatNumber(stock.totalCost, numberFormat)}
      </td>
      {visibleColumns.avgBuy && (
        <td title={formatNumber(avgBuy, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>
          {formatAvgPrice(avgBuy, numberFormat)}
        </td>
      )}
      <td title={formatNumber(stock.sharesSold, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.sharesSold, numberFormat)}
      </td>
      <td title={formatNumber(stock.totalCostSold, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
        {formatNumber(stock.totalCostSold, numberFormat)}
      </td>
      {visibleColumns.avgSell && (
        <td title={formatNumber(avgSell, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>
          {formatAvgPrice(avgSell, numberFormat)}
        </td>
      )}
      {visibleColumns.profit && (
        <td title={formatNumber(profit, 'full')} className={`td-base td-right ${profit >= 0 ? 'td-profit-positive' : 'td-profit-negative'}`}>
          {profit >= 0 ? '+' : ''}{formatNumber(profit, numberFormat)}
        </td>
      )}
      {visibleColumns.desiredStock !== false && (
        <td title={formatNumber(stock.needed, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
          {formatNumber(stock.needed, numberFormat)}
        </td>
      )}
      {visibleColumns.limit4h && (
        <td title={formatNumber(stock.limit4h, 'full')} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>
          {formatNumber(stock.limit4h, numberFormat)}
        </td>
      )}
      {visibleColumns.geHigh && (
        <td title={stock.itemId && geData[stock.itemId]?.high != null ? formatNumber(geData[stock.itemId].high, 'full') : undefined} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)', color: 'rgb(134, 239, 172)' }}>
          {stock.itemId && geData[stock.itemId]?.high != null
            ? formatNumber(geData[stock.itemId].high, numberFormat)
            : 'NA'}
        </td>
      )}
      {visibleColumns.geLow && (
        <td title={stock.itemId && geData[stock.itemId]?.low != null ? formatNumber(geData[stock.itemId].low, 'full') : undefined} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)', color: 'rgb(134, 239, 172)' }}>
          {stock.itemId && geData[stock.itemId]?.low != null
            ? formatNumber(geData[stock.itemId].low, numberFormat)
            : 'NA'}
        </td>
      )}
      {visibleColumns.unrealizedProfit && (() => {
        const latestHigh = stock.itemId ? geData[stock.itemId]?.high : null;
        const unrealized = calculateUnrealizedProfit(stock, latestHigh, stock.itemId);
        return (
          <td title={unrealized != null ? formatNumber(unrealized, 'full') : undefined} className={`td-base td-right ${unrealized == null ? '' : unrealized >= 0 ? 'td-profit-positive' : 'td-profit-negative'}`}>
            {unrealized == null ? 'NA' : `${unrealized >= 0 ? '+' : ''}${formatNumber(unrealized, numberFormat)}`}
          </td>
        );
      })()}
      {showInvestmentDate && (
        <td style={{ padding: '0.25rem 0.5rem', border: '1px solid rgb(51, 65, 85)' }}>
          <div
            className="investment-date-wrapper"
            title={stock.investmentStartDate ? `${investmentAge(stock.investmentStartDate)} ago` : undefined}
            onClick={(e) => e.currentTarget.querySelector('input').showPicker?.()}
          >
            <input
              type="date"
              className="investment-date-input"
              value={stock.investmentStartDate || ''}
              onChange={(e) => onInvestmentDateChange(stock, e.target.value || null)}
            />
          </div>
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
          onRemove={onRemove}
          onAdjust={onAdjust}
          onDelete={onDelete}
          onCalculate={onCalculate}
          onArchive={onArchive}
        />
      </td>
    </tr>
  );
}

function StatusBadge({ stock }) {
  if (stock.timerEndTime && stock.timerEndTime > Date.now()) {
    return (
      <div className="td-center">
        <span className="badge badge-timer">
          <span>⏰</span>
          <span>{formatTimer(stock.timerEndTime)}</span>
        </span>
      </div>
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

function ActionButtons({ stock, onBuy, onSell, onRemove, onAdjust, onDelete, onCalculate, onArchive }) {
  return (
    <div className="action-buttons">
      <button className="btn btn-success btn-sm" onClick={() => onBuy(stock)}>
        Buy
      </button>
      <button className="btn btn-sell btn-sm" onClick={() => onSell(stock)}>
        Sell
      </button>
      <button className="btn btn-remove btn-sm" onClick={() => onRemove(stock)}>
        Remove
      </button>
      <button className="btn btn-blue btn-sm" onClick={() => onCalculate(stock)}>
        ⏱️ Calc
      </button>
      <button className="btn btn-warning btn-sm" onClick={() => onAdjust(stock)}>
        Adjust
      </button>
      <button className="btn btn-secondary btn-sm" onClick={() => onArchive(stock)} title="Archive">
        📦 Archive
      </button>
      <button className="btn btn-danger btn-sm" onClick={() => onDelete(stock)}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}
