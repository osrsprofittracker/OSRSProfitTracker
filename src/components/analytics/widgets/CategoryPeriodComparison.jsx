import React, { useMemo } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { sumBucketsByCategory } from '../../../utils/categoryAnalytics';

const columnsFor = (timeframeLabel) => [
  {
    key: 'category',
    label: 'Category',
    tooltip: 'Stock category being compared.',
  },
  {
    key: 'current',
    label: `${timeframeLabel} profit`,
    tooltip: `Realized item profit in the selected ${timeframeLabel} timeframe.`,
  },
  {
    key: 'prior',
    label: 'Prior profit',
    tooltip: `Realized item profit in the immediately previous same-length timeframe before ${timeframeLabel}.`,
  },
  {
    key: 'change',
    label: 'Change',
    tooltip: 'Current timeframe profit minus prior same-length timeframe profit.',
  },
  {
    key: 'changePct',
    label: 'Change %',
    tooltip: 'Change divided by the absolute prior timeframe value. A dash means the prior value was zero.',
  },
];

export default function CategoryPeriodComparison({
  currentBuckets = [],
  priorBuckets = [],
  timeframeLabel = 'selected',
  numberFormat,
}) {
  const columns = columnsFor(timeframeLabel);
  const rows = useMemo(() => {
    const current = sumBucketsByCategory(currentBuckets);
    const prior = sumBucketsByCategory(priorBuckets);
    const categories = new Set([...current.keys(), ...prior.keys()]);

    return [...categories]
      .map((category) => {
        const currentValue = current.get(category) || 0;
        const priorValue = prior.get(category) || 0;
        const change = currentValue - priorValue;
        const changePct = priorValue !== 0 ? (change / Math.abs(priorValue)) * 100 : null;

        return {
          category,
          current: currentValue,
          prior: priorValue,
          change,
          changePct,
        };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [currentBuckets, priorBuckets]);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Selected global timeframe versus the immediately previous same-length timeframe. Values are realized item profit from by-category buckets."
          >
            Category period comparison
          </h3>
          <p className="analytics-widget-subtitle">{timeframeLabel} vs previous same-length window</p>
        </div>
      </div>
      <div className="items-table-wrap is-compact">
        <table className="items-table category-table is-readonly">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  <span className="category-table-tooltip has-tooltip" data-tooltip={column.tooltip}>
                    {column.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="category-table-row" key={row.category}>
                <td>{row.category}</td>
                <td>{formatNumber(row.current, numberFormat)}</td>
                <td>{formatNumber(row.prior, numberFormat)}</td>
                <td className={row.change < 0 ? 'items-profit-negative' : 'items-profit-positive'}>
                  {formatNumber(row.change, numberFormat)}
                </td>
                <td className={(row.changePct || 0) < 0 ? 'items-profit-negative' : 'items-profit-positive'}>
                  {row.changePct == null ? '-' : `${row.changePct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="items-table-empty" colSpan={5}>
                  No category profit in the current or prior window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
