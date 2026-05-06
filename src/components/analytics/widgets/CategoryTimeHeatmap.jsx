import React, { useMemo, useRef, useState } from 'react';
import { buildCategoryHeatmapRows } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const CELL_SIZE = 18;
const CELL_GAP = 3;
const CELL_WIDTH = 46;
const LABEL_WIDTH = 190;
const TOP_LABEL_HEIGHT = 28;
const ROW_HEIGHT = CELL_SIZE + CELL_GAP;
const DEFAULT_VISIBLE_ROWS = 18;
const TOOLTIP_WIDTH = 112;
const TOOLTIP_HEIGHT = 36;

const toNumber = (value) => Number(value) || 0;

function normalizeBucketsByDate(buckets = []) {
  const byDate = new Map();

  for (const bucket of buckets || []) {
    if (!bucket?.bucket_date) continue;

    const existing = byDate.get(bucket.bucket_date) || {
      bucket_date: bucket.bucket_date,
      by_category: {},
    };

    for (const [category, value] of Object.entries(bucket.by_category || {})) {
      existing.by_category[category] = toNumber(existing.by_category[category]) + toNumber(value);
    }

    byDate.set(bucket.bucket_date, existing);
  }

  return [...byDate.values()].sort((a, b) => a.bucket_date.localeCompare(b.bucket_date));
}

function buildQuantiles(values, count = 5) {
  const sorted = [...values].filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return [];

  return Array.from({ length: count }, (_, index) => {
    const quantileIndex = Math.ceil((sorted.length * (index + 1)) / count) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, quantileIndex))];
  });
}

function shadeClass(value, positiveThresholds, negativeThresholds) {
  if (value === 0) return 'is-zero';

  const thresholds = value > 0 ? positiveThresholds : negativeThresholds;
  const magnitude = Math.abs(value);
  const index = thresholds.findIndex((threshold) => magnitude <= threshold);
  const shade = index === -1 ? thresholds.length - 1 : index;
  const clampedShade = Math.max(0, Math.min(4, shade));

  return value > 0 ? `is-positive shade-${clampedShade}` : `is-negative shade-${clampedShade}`;
}

function cellLabel(category, date, profit, numberFormat) {
  return `${category}, ${date}: ${formatNumber(profit, numberFormat)} profit`;
}

function tooltipPosition(x, y, width) {
  const rightSide = x + CELL_WIDTH + 8;
  const leftSide = x - TOOLTIP_WIDTH - 8;
  const tooltipX = rightSide + TOOLTIP_WIDTH <= width ? rightSide : Math.max(LABEL_WIDTH, leftSide);

  return {
    x: tooltipX,
    y: Math.max(2, y - Math.floor((TOOLTIP_HEIGHT - CELL_SIZE) / 2)),
  };
}

function compactLabel(value) {
  const label = String(value || '');
  return label.length > 17 ? `${label.slice(0, 16)}...` : label;
}

export default function CategoryTimeHeatmap({
  buckets = [],
  categories = [],
  timeframeLabel = 'selected',
  numberFormat,
}) {
  const tooltipRef = useRef(null);
  const tooltipCategoryRef = useRef(null);
  const tooltipProfitRef = useRef(null);
  const tooltipDateRef = useRef(null);
  const activeCellLabelRef = useRef(null);
  const normalizedBuckets = useMemo(
    () => normalizeBucketsByDate(buckets),
    [buckets]
  );
  const rows = useMemo(
    () => buildCategoryHeatmapRows({ buckets: normalizedBuckets, categories }),
    [normalizedBuckets, categories]
  );
  const rankedRows = useMemo(() => (
    [...rows].sort((a, b) => {
      const aTotal = a.cells.reduce((sum, cell) => sum + Math.abs(cell.profit), 0);
      const bTotal = b.cells.reduce((sum, cell) => sum + Math.abs(cell.profit), 0);
      if (aTotal !== bTotal) return bTotal - aTotal;
      return a.category.localeCompare(b.category);
    })
  ), [rows]);
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? rankedRows : rankedRows.slice(0, DEFAULT_VISIBLE_ROWS);
  const dates = useMemo(
    () => normalizedBuckets.map((bucket) => bucket.bucket_date),
    [normalizedBuckets]
  );
  const values = useMemo(
    () => rankedRows.flatMap((row) => row.cells.map((cell) => cell.profit)),
    [rankedRows]
  );
  const positiveThresholds = useMemo(
    () => buildQuantiles(values.filter((value) => value > 0)),
    [values]
  );
  const negativeThresholds = useMemo(
    () => buildQuantiles(values.filter((value) => value < 0).map((value) => Math.abs(value))),
    [values]
  );

  const width = LABEL_WIDTH + dates.length * (CELL_WIDTH + CELL_GAP);
  const height = TOP_LABEL_HEIGHT + visibleRows.length * ROW_HEIGHT;
  const hasHiddenRows = rankedRows.length > DEFAULT_VISIBLE_ROWS;
  const showCellDetail = (cell) => {
    const profit = Number(cell.profit) || 0;

    if (tooltipRef.current) {
      tooltipRef.current.setAttribute('transform', `translate(${cell.tooltip.x} ${cell.tooltip.y})`);
      tooltipRef.current.classList.add('is-visible');
    }

    if (tooltipCategoryRef.current) tooltipCategoryRef.current.textContent = compactLabel(cell.category);
    if (tooltipProfitRef.current) {
      tooltipProfitRef.current.textContent = formatNumber(profit, numberFormat);
      tooltipProfitRef.current.setAttribute('class', profit < 0 ? 'is-negative' : 'is-positive');
    }
    if (tooltipDateRef.current) tooltipDateRef.current.textContent = String(cell.date).slice(5);
    if (activeCellLabelRef.current) {
      activeCellLabelRef.current.textContent = `${cell.category} - ${cell.date}: ${formatNumber(profit, numberFormat)}`;
    }
  };

  const hideCellDetail = () => {
    tooltipRef.current?.classList.remove('is-visible');
    if (activeCellLabelRef.current) activeCellLabelRef.current.textContent = '';
  };

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Category profit by date. Green cells are profitable, red cells are losses, and brighter cells are larger moves."
          >
            Category time heatmap
          </h3>
          <p className="analytics-widget-subtitle">
            Rows are categories, columns are dates in {timeframeLabel}.
          </p>
        </div>
        <span
          ref={activeCellLabelRef}
          className="analytics-widget-subtitle category-time-heatmap-active"
          aria-live="polite"
        />
      </div>

      {!rankedRows.length || !dates.length ? (
        <div className="analytics-widget-empty">No category profit in this window.</div>
      ) : (
        <>
          <div className="category-time-heatmap-wrap">
            <svg
              className="category-time-heatmap-svg"
              viewBox={`0 0 ${width} ${height}`}
              width={width}
              height={height}
              role="img"
              aria-label="Category profit heatmap over time"
            >
              <title>Category profit heatmap over time</title>
              {dates.map((date, index) => {
                const x = LABEL_WIDTH + index * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2;

                return (
                  <text
                    key={date}
                    className="category-time-heatmap-date"
                    x={x}
                    y={17}
                    textAnchor="middle"
                  >
                    {date.slice(5)}
                  </text>
                );
              })}

              {visibleRows.map((row, rowIndex) => {
                const y = TOP_LABEL_HEIGHT + rowIndex * ROW_HEIGHT;

                return (
                  <g key={row.category}>
                    <text
                      className="category-time-heatmap-label"
                      x={LABEL_WIDTH - 12}
                      y={y + CELL_SIZE - 4}
                      textAnchor="end"
                    >
                      {row.category}
                    </text>
                    {row.cells.map((cell, cellIndex) => {
                      const x = LABEL_WIDTH + cellIndex * (CELL_WIDTH + CELL_GAP);
                      const className = `category-time-heatmap-cell ${shadeClass(
                        cell.profit,
                        positiveThresholds,
                        negativeThresholds
                      )}`;
                      const active = {
                        category: row.category,
                        date: cell.date,
                        profit: cell.profit,
                        tooltip: tooltipPosition(x, y, width),
                      };

                      return (
                        <rect
                          key={`${row.category}-${cell.date}`}
                          className={className}
                          x={x}
                          y={y}
                          width={CELL_WIDTH}
                          height={CELL_SIZE}
                          rx="3"
                          tabIndex="0"
                          aria-label={cellLabel(row.category, cell.date, cell.profit, numberFormat)}
                          onMouseEnter={() => showCellDetail(active)}
                          onMouseLeave={hideCellDetail}
                          onFocus={() => showCellDetail(active)}
                          onBlur={hideCellDetail}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              showCellDetail(active);
                            }
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}
              <g ref={tooltipRef} className="category-time-heatmap-svg-tooltip">
                <rect width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="6" />
                <text ref={tooltipCategoryRef} x="7" y="13" />
                <text ref={tooltipProfitRef} x="7" y="28" />
                <text ref={tooltipDateRef} x="76" y="28" className="is-muted" />
              </g>
            </svg>
          </div>
          {hasHiddenRows && (
            <div className="category-time-heatmap-footer">
              <span className="items-table-pager-count">
                Showing {visibleRows.length} of {rankedRows.length} categories
              </span>
              <button
                type="button"
                className="items-table-show-more"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? 'Show fewer' : 'Show all'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
