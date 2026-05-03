import React, { useState } from 'react';
import {
  computeCategoryContribution,
  getCategoryColor,
  getCategoryColorIndex,
} from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const BAR_WIDTH = 1000;
const BAR_HEIGHT = 32;
const MIN_VISIBLE_WIDTH = 12;

const displaySegmentsFor = (rows) => {
  const nonZero = rows.filter((row) => row.pct > 0);
  const minWidthTotal = nonZero.length * MIN_VISIBLE_WIDTH;
  const remainingWidth = Math.max(0, BAR_WIDTH - minWidthTotal);

  return nonZero.map((row) => ({
    ...row,
    displayWidth: MIN_VISIBLE_WIDTH + ((row.pct / 100) * remainingWidth),
  }));
};

export default function CategoryContributionBar({ buckets = [], categories = [], numberFormat }) {
  const rows = computeCategoryContribution(buckets, categories);
  const segments = displaySegmentsFor(rows);
  const [activeRow, setActiveRow] = useState(null);
  const activeTooltip = activeRow
    ? `${activeRow.category}: ${formatNumber(activeRow.profit, numberFormat)} selected-window profit, ${activeRow.pct.toFixed(1)}% contribution.`
    : 'Hover a segment to inspect that category contribution.';
  let cursor = 0;

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Share of selected-timeframe realized item profit magnitude. Loss-making categories still contribute by absolute size."
          >
            Category contribution
          </h3>
          <p className="analytics-widget-subtitle">Percent of selected-window category profit movement</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="analytics-widget-empty">No category profit in this window.</div>
      ) : (
        <>
          <div
            className="category-contribution-tooltip-wrap has-tooltip"
            data-tooltip={activeTooltip}
          >
            <svg
              className="category-contribution-svg"
              viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`}
              role="img"
              aria-label="Category contribution stacked bar"
            >
              {segments.map((row) => {
                const width = row.displayWidth;
                const x = cursor;
                cursor += width;

                return (
                  <rect
                    key={row.category}
                    className="category-contribution-segment"
                    tabIndex={0}
                    x={x}
                    y="0"
                    width={width}
                    height={BAR_HEIGHT}
                    fill={getCategoryColor(row.category)}
                    onFocus={() => setActiveRow(row)}
                    onBlur={() => setActiveRow(null)}
                    onMouseEnter={() => setActiveRow(row)}
                    onMouseLeave={() => setActiveRow(null)}
                  />
                );
              })}
            </svg>
          </div>
          <div className="analytics-legend category-contribution-legend" aria-label="Category contribution legend">
            {rows.map((row) => (
              <span
                className="analytics-legend-item has-tooltip"
                data-tooltip={`${row.category}: ${formatNumber(row.profit, numberFormat)} selected-window profit, ${row.pct.toFixed(1)}% contribution.`}
                key={row.category}
              >
                <span className={`analytics-legend-swatch category-color-${getCategoryColorIndex(row.category)}`} aria-hidden="true" />
                {row.category} ({row.pct.toFixed(1)}%)
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
