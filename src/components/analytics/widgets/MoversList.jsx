import React from 'react';
import { formatNumber } from '../../../utils/formatters';

export default function MoversList({
  gainers = [],
  numberFormat,
  onItemClick,
}) {
  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Items ranked by all-time realized profit from sold stock totals."
        >
          Top gainers
        </h3>
      </div>
      <ul className="items-movers-list">
        {gainers.length === 0 && <li className="items-muted">No sold items to rank.</li>}
        {gainers.map((item) => {
          const value = Number(item.totalProfit) || 0;
          const valueClassName = value < 0 ? 'items-profit-negative' : 'items-profit-positive';

          return (
            <li key={item.id}>
              <button
                type="button"
                className="items-movers-row has-tooltip"
                onClick={() => onItemClick?.(item)}
                data-tooltip={`Open ${item.name} drilldown.`}
              >
                <span className="items-movers-name">{item.name}</span>
                <span className={valueClassName}>{formatNumber(value, numberFormat)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
