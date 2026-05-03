import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { formatNumber } from '../../../utils/formatters';
import { calculateGETax } from '../../../utils/taxUtils';

const COLUMNS = [
  {
    key: 'name',
    label: 'Name',
    tooltip: 'Tracked item name. Click a row to open the item drilldown.',
  },
  {
    key: 'category',
    label: 'Category',
    tooltip: 'The item category assigned in the main trading view.',
  },
  {
    key: 'shares',
    label: 'Held',
    tooltip: 'Current quantity still held.',
  },
  {
    key: 'totalCost',
    label: 'Cost',
    tooltip: 'Current cost basis for the quantity still held.',
  },
  {
    key: 'totalProfit',
    label: 'Total profit',
    tooltip: 'All-time realized item profit from the tracked stock totals.',
  },
  {
    key: 'marginPct',
    label: 'Margin',
    tooltip: 'All-time realized profit divided by all-time sold cost basis.',
  },
  {
    key: 'unrealizedProfit',
    label: 'Unrealized profit',
    tooltip: 'Estimated profit if current holdings sold now at live GE high after tax. Not affected by the selected timeframe.',
  },
  {
    key: 'windowSells',
    label: 'Sells',
    tooltip: 'Sell transaction count in the selected timeframe.',
  },
  {
    key: 'windowGpTraded',
    label: 'GP traded',
    tooltip: 'Buy plus sell GP volume in the selected timeframe.',
  },
];

const numericKeys = new Set([
  'shares',
  'totalCost',
  'totalProfit',
  'marginPct',
  'unrealizedProfit',
  'windowSells',
  'windowGpTraded',
]);

const PAGE_SIZE = 50;

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={14} className="items-table-sort-icon" aria-hidden="true" />;
  if (direction === 'asc') return <ArrowUp size={14} className="items-table-sort-icon" aria-hidden="true" />;
  return <ArrowDown size={14} className="items-table-sort-icon" aria-hidden="true" />;
}

const formatCell = (item, key, numberFormat) => {
  const value = item[key];

  if (key === 'marginPct') return `${(Number(value) || 0).toFixed(1)}%`;
  if (numericKeys.has(key)) return formatNumber(value, numberFormat);
  return value || '-';
};

const cellTooltip = (item, key, numberFormat) => {
  if (key !== 'unrealizedProfit') return null;
  if (item.unrealizedProfit == null) return 'No live GE high price is available for this item.';

  const avgBuy = item.shares > 0 ? item.totalCost / item.shares : 0;
  const tax = calculateGETax(item.itemId, item.latestHigh);

  return `(${formatNumber(item.latestHigh, numberFormat)} GE high - ${formatNumber(tax, numberFormat)} tax - ${formatNumber(avgBuy, numberFormat)} avg buy) x ${formatNumber(item.shares, numberFormat)} held = ${formatNumber(item.unrealizedProfit, numberFormat)}`;
};

const valueClass = (key, value) => {
  if (key !== 'unrealizedProfit' && key !== 'totalProfit') return '';
  if ((Number(value) || 0) < 0) return 'items-profit-negative';
  return 'items-profit-positive';
};

export default function ItemsTable({ items = [], totalItems = items.length, numberFormat, onRowClick }) {
  const [sortKey, setSortKey] = useState('totalProfit');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    const rows = [...items];

    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (!numericKeys.has(sortKey)) {
        const comparison = String(av || '').localeCompare(String(bv || ''));
        return sortDir === 'asc' ? comparison : -comparison;
      }

      const comparison = (Number(av) || 0) - (Number(bv) || 0);
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [items, sortKey, sortDir]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items, sortKey, sortDir]);

  const usesPager = sorted.length > PAGE_SIZE;
  const visibleRows = usesPager ? sorted.slice(0, visibleCount) : sorted;
  const canShowMore = usesPager && visibleRows.length < sorted.length;
  const hiddenCount = Math.max(0, sorted.length - visibleRows.length);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir(numericKeys.has(key) ? 'desc' : 'asc');
  };

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="All tracked items with no top-item cap. Sort columns or click a row for item detail."
        >
          Items table
        </h3>
        <span
          className="items-widget-note has-tooltip"
          data-tooltip="This count reflects the active filters above."
        >
          {items.length} / {totalItems} items
        </span>
      </div>
      <div className="items-table-wrap">
        <table className="items-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  <button
                    type="button"
                    className="items-table-header-button has-tooltip"
                    onClick={() => handleSort(column.key)}
                    data-tooltip={column.tooltip}
                  >
                    <span>{column.label}</span>
                    <SortIcon active={sortKey === column.key} direction={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((item) => (
              <tr
                key={item.id}
                tabIndex={0}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onRowClick?.(item);
                }}
              >
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={`${column.key === 'name' ? 'items-name-cell' : ''} ${valueClass(column.key, item[column.key])}${cellTooltip(item, column.key, numberFormat) ? ' has-tooltip' : ''}`}
                    data-tooltip={cellTooltip(item, column.key, numberFormat) || undefined}
                  >
                    {formatCell(item, column.key, numberFormat)}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="items-table-empty" colSpan={COLUMNS.length}>
                  No items match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {usesPager && (
        <div className="items-table-pager">
          <span className="items-table-pager-count">
            Showing {visibleRows.length} of {sorted.length}
          </span>
          {canShowMore && (
            <button
              type="button"
              className="items-table-show-more"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, sorted.length))}
            >
              Show {Math.min(PAGE_SIZE, hiddenCount)} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
