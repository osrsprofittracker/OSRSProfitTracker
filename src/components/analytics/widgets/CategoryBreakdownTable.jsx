import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { formatNumber } from '../../../utils/formatters';

const COLUMNS = [
  {
    key: 'category',
    label: 'Category',
    tooltip: 'Stock category. Counts and current inventory come from all matching stock rows.',
  },
  {
    key: 'uniqueItems',
    label: 'Items',
    tooltip: 'Tracked items in this category, including rows with no current holdings.',
  },
  {
    key: 'inventoryValue',
    label: 'Funds tied up',
    tooltip: 'Current cost basis still tied up in held stock. Not affected by the timeframe.',
  },
  {
    key: 'unrealizedProfit',
    label: 'Unrealized profit',
    tooltip: 'Estimated profit if current holdings sold now at live GE high after tax. Not affected by the timeframe.',
  },
  {
    key: 'gpTradedWindow',
    label: 'GP traded',
    tooltip: 'Buy plus sell GP volume in the selected timeframe.',
  },
  {
    key: 'windowProfit',
    label: 'Profit',
    tooltip: 'Selected-timeframe realized item profit from analytics by-category buckets.',
  },
  {
    key: 'avgMarginPct',
    label: 'Margin',
    tooltip: 'Selected-timeframe category profit divided by estimated sold cost basis in the same timeframe. This is weighted by GP moved, not an average of item percentages.',
  },
];

const numericKeys = new Set([
  'uniqueItems',
  'inventoryValue',
  'unrealizedProfit',
  'gpTradedWindow',
  'windowProfit',
  'avgMarginPct',
]);

const PAGE_SIZE = 50;

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={14} className="items-table-sort-icon" aria-hidden="true" />;
  if (direction === 'asc') return <ArrowUp size={14} className="items-table-sort-icon" aria-hidden="true" />;
  return <ArrowDown size={14} className="items-table-sort-icon" aria-hidden="true" />;
}

const formatCell = (row, key, numberFormat) => {
  const value = row[key];
  if (key === 'avgMarginPct') return `${(Number(value) || 0).toFixed(1)}%`;
  if (numericKeys.has(key)) return formatNumber(value, numberFormat);
  return value || '-';
};

const valueClass = (key, value) => {
  if (key !== 'windowProfit' && key !== 'avgMarginPct' && key !== 'unrealizedProfit') return '';
  if ((Number(value) || 0) < 0) return 'items-profit-negative';
  return 'items-profit-positive';
};

export default function CategoryBreakdownTable({
  rows = [],
  totalCategories = rows.length,
  timeframeLabel = 'selected',
  numberFormat,
}) {
  const [sortKey, setSortKey] = useState('windowProfit');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    const output = [...rows];

    output.sort((a, b) => {
      if (!numericKeys.has(sortKey)) {
        const comparison = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
        return sortDir === 'asc' ? comparison : -comparison;
      }

      const comparison = (Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0);
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return output;
  }, [rows, sortKey, sortDir]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [rows, sortKey, sortDir]);

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
          data-tooltip="Sortable category table. Snapshot columns use stock totals; window profit uses selected-timeframe analytics buckets."
        >
          Category breakdown
        </h3>
        <span className="items-widget-note has-tooltip" data-tooltip="This count reflects the active category filter.">
          {rows.length} / {totalCategories} categories
        </span>
      </div>
      <div className="items-table-wrap">
        <table className="items-table category-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  <button
                    type="button"
                    className="items-table-header-button has-tooltip"
                    data-tooltip={column.tooltip}
                    onClick={() => handleSort(column.key)}
                  >
                    <span>
                      {column.key === 'windowProfit' && `Profit (${timeframeLabel})`}
                      {column.key === 'gpTradedWindow' && `GP traded (${timeframeLabel})`}
                      {column.key === 'avgMarginPct' && `Margin (${timeframeLabel})`}
                      {column.key !== 'windowProfit' && column.key !== 'gpTradedWindow' && column.key !== 'avgMarginPct' && column.label}
                    </span>
                    <SortIcon active={sortKey === column.key} direction={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr className="category-table-row" key={row.category}>
                {COLUMNS.map((column) => (
                  <td key={column.key} className={valueClass(column.key, row[column.key])}>
                    {formatCell(row, column.key, numberFormat)}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="items-table-empty" colSpan={COLUMNS.length}>
                  No categories match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {usesPager && (
        <div className="items-table-pager">
          <span className="items-table-pager-count">Showing {visibleRows.length} of {sorted.length}</span>
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
