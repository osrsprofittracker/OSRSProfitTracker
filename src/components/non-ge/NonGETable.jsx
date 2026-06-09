import React, { useMemo } from 'react';
import { Archive, ArrowDown, ArrowUp, CircleDollarSign, GripVertical, MinusCircle, Pencil, ShoppingCart, StickyNote, Trash2 } from 'lucide-react';
import ItemIcon from '../ItemIcon';
import RowActionMenu from '../RowActionMenu';
import { calculateAvgBuyPrice, calculateAvgSellPrice, calculateProfit } from '../../utils/calculations';
import { formatAvgPrice, formatNumber } from '../../utils/formatters';
import { getNonGECatalogItem, getNonGEItemImageUrl, nonGEItemDisplayName, nonGEItemRangeLabel } from '../../utils/nonGeCatalog';

function sortNonGEStocks(stocks, sortConfig) {
  if (!sortConfig?.key) return stocks;

  return [...stocks].sort((a, b) => {
    let aVal;
    let bVal;

    switch (sortConfig.key) {
      case 'name':
        aVal = nonGEItemDisplayName(a).toLowerCase();
        bVal = nonGEItemDisplayName(b).toLowerCase();
        break;
      case 'shares':
      case 'totalCost':
      case 'sharesSold':
      case 'totalCostSold':
      case 'targetBuyPrice':
      case 'targetSellPrice':
        aVal = a[sortConfig.key] ?? 0;
        bVal = b[sortConfig.key] ?? 0;
        break;
      case 'avgBuy':
        aVal = calculateAvgBuyPrice(a);
        bVal = calculateAvgBuyPrice(b);
        break;
      case 'avgSell':
        aVal = calculateAvgSellPrice(a);
        bVal = calculateAvgSellPrice(b);
        break;
      case 'profit':
        aVal = calculateProfit(a);
        bVal = calculateProfit(b);
        break;
      case 'range':
        aVal = nonGEItemRangeLabel(getNonGECatalogItem(a.catalogItemKey)).toLowerCase();
        bVal = nonGEItemRangeLabel(getNonGECatalogItem(b.catalogItemKey)).toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ columnKey, sortConfig }) {
  if (sortConfig?.key !== columnKey) return null;
  const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  return <Icon size={12} className="non-ge-sort-icon" aria-hidden="true" />;
}

function HeaderCell({ label, columnKey, sortConfig, onSort, align = 'left' }) {
  const sortable = Boolean(columnKey && onSort);

  return (
    <th className={`th-base ${sortable ? 'th-sortable' : ''} non-ge-table-th non-ge-table-th--${align}`}>
      {sortable ? (
        <button type="button" className="non-ge-sort-btn" onClick={() => onSort(columnKey)}>
          <span>{label}</span>
          <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

function NumberCell({ value, numberFormat, className = '' }) {
  return (
    <td className={`td-base td-right ${className}`} title={formatNumber(value, 'full')}>
      {formatNumber(value, numberFormat)}
    </td>
  );
}

function closeMenuAndRun(action, stock) {
  action(stock);
}

export default function NonGETable({
  stocks,
  categoryId,
  numberFormat,
  sortConfig,
  onSort,
  onArchive,
  onDelete,
  onBuy,
  onSell,
  onRemove,
  onAdjust,
  onNotes,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const sortedStocks = useMemo(() => sortNonGEStocks(stocks, sortConfig), [stocks, sortConfig]);

  if (sortedStocks.length === 0) {
    return (
      <div className="non-ge-empty-table">
        No items in this category.
      </div>
    );
  }

  return (
    <div className="table-container non-ge-table-wrap">
      <table className="table-base non-ge-table">
        <colgroup>
          <col className="non-ge-col-grip" />
          <col className="non-ge-col-name" />
          <col className="non-ge-col-held" />
          <col className="non-ge-col-total-cost" />
          <col className="non-ge-col-avg-buy" />
          <col className="non-ge-col-sold-qty" />
          <col className="non-ge-col-sold-price" />
          <col className="non-ge-col-avg-sell" />
          <col className="non-ge-col-profit" />
          <col className="non-ge-col-range" />
          <col className="non-ge-col-target" />
          <col className="non-ge-col-target" />
          <col className="non-ge-col-actions" />
        </colgroup>
        <thead className="thead-base">
          <tr>
            <th className="th-icon-empty"></th>
            <HeaderCell label="Name" columnKey="name" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell label="Held Qty" columnKey="shares" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Total Cost" columnKey="totalCost" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Avg Buy" columnKey="avgBuy" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Qty Sold" columnKey="sharesSold" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Total Sold Price" columnKey="totalCostSold" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Avg Sell" columnKey="avgSell" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Profit" columnKey="profit" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Range" columnKey="range" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell label="Target Buy" columnKey="targetBuyPrice" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Target Sell" columnKey="targetSellPrice" sortConfig={sortConfig} onSort={onSort} align="right" />
            <HeaderCell label="Actions" align="right" />
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map((stock, index) => {
            const catalogItem = getNonGECatalogItem(stock.catalogItemKey);
            const name = nonGEItemDisplayName(stock);
            const avgBuy = calculateAvgBuyPrice(stock);
            const avgSell = calculateAvgSellPrice(stock);
            const profit = calculateProfit(stock);

            return (
              <tr
                key={stock.id}
                className={`tr-base ${index % 2 ? 'tr-even' : 'tr-odd'} non-ge-table-row`}
                data-stock-id={stock.id}
                draggable
                onDragStart={(event) => onDragStart(event, stock, categoryId)}
                onDragOver={onDragOver}
                onDrop={(event) => onDrop(event, stock, categoryId)}
              >
                <td className="td-base td-center non-ge-grip-cell">
                  <GripVertical size={16} />
                </td>
                <td className="td-base">
                  <div className="non-ge-name-cell">
                    <ItemIcon
                      src={getNonGEItemImageUrl(catalogItem) || stock.imageUrl}
                      alt=""
                      className="non-ge-item-icon"
                      fallbackText={name}
                    />
                    <div className="non-ge-name-text">
                      <span className="non-ge-item-name">{name}</span>
                    </div>
                    <div className="stock-name-actions">
                      <button
                        type="button"
                        className={`item-notes-btn ${stock.notes ? 'item-notes-btn--active' : ''}`}
                        onClick={() => onNotes(stock)}
                        title={stock.notes ? 'Edit notes' : 'Add notes'}
                        aria-label={stock.notes ? `Edit notes for ${name}` : `Add notes for ${name}`}
                      >
                        <StickyNote size={12} />
                      </button>
                    </div>
                  </div>
                </td>
                <NumberCell value={stock.shares} numberFormat={numberFormat} />
                <NumberCell value={stock.totalCost} numberFormat={numberFormat} />
                <td className="td-base td-right non-ge-table-td--accent" title={formatNumber(avgBuy, 'full')}>
                  {formatAvgPrice(avgBuy, numberFormat)}
                </td>
                <NumberCell value={stock.sharesSold} numberFormat={numberFormat} />
                <NumberCell value={stock.totalCostSold} numberFormat={numberFormat} />
                <td className="td-base td-right non-ge-table-td--accent" title={formatNumber(avgSell, 'full')}>
                  {formatAvgPrice(avgSell, numberFormat)}
                </td>
                <td className={`td-base td-right ${profit >= 0 ? 'td-profit-positive' : 'td-profit-negative'}`} title={formatNumber(profit, 'full')}>
                  {profit >= 0 ? '+' : ''}{formatNumber(profit, numberFormat)}
                </td>
                <td className="td-base non-ge-range-cell">
                  {catalogItem ? nonGEItemRangeLabel(catalogItem) : 'Unknown'}
                </td>
                <NumberCell value={stock.targetBuyPrice} numberFormat={numberFormat} />
                <NumberCell value={stock.targetSellPrice} numberFormat={numberFormat} />
                <td className="td-base non-ge-actions-cell">
                  <div className="action-buttons row-action-buttons non-ge-action-buttons">
                    <button type="button" className="btn btn-success btn-sm" onClick={() => onBuy(stock)} title="Buy">
                      <ShoppingCart size={12} />
                      Buy
                    </button>
                    <button
                      type="button"
                      className="btn btn-sell btn-sm"
                      onClick={() => onSell(stock)}
                      disabled={(stock.shares || 0) <= 0}
                      title="Sell"
                    >
                      <CircleDollarSign size={12} />
                      Sell
                    </button>
                    <RowActionMenu>
                      <button
                        type="button"
                        className="row-action-menu-item"
                        onClick={() => closeMenuAndRun(onRemove, stock)}
                        disabled={(stock.shares || 0) <= 0}
                      >
                        <MinusCircle size={14} />
                        Remove
                      </button>
                      <button type="button" className="row-action-menu-item" onClick={() => closeMenuAndRun(onAdjust, stock)}>
                        <Pencil size={14} />
                        Adjust
                      </button>
                      <button type="button" className="row-action-menu-item" onClick={() => closeMenuAndRun(onArchive, stock)}>
                        <Archive size={14} />
                        Archive
                      </button>
                      {onDelete && (
                        <button type="button" className="row-action-menu-item row-action-menu-item--danger" onClick={() => closeMenuAndRun(onDelete, stock)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </RowActionMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
