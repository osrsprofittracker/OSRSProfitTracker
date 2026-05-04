import React, { useMemo, useState } from 'react';
import { buildCategoryHeatmapRows } from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const CELL_SIZE = 18;
const CELL_GAP = 3;
const LABEL_WIDTH = 9 * CELL_SIZE;
const TOP_LABEL_HEIGHT = 3 * CELL_SIZE;
const ROW_HEIGHT = CELL_SIZE + CELL_GAP;
const DATE_LABEL_INTERVAL = 1;

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

export default function CategoryTimeHeatmap({
  buckets = [],
  categories = [],
  timeframeLabel = 'selected',
  numberFormat,
}) {
  const [activeCell, setActiveCell] = useState(null);
  const rows = useMemo(
    () => buildCategoryHeatmapRows({ buckets, categories }),
    [buckets, categories]
  );
  const dates = useMemo(
    () => (buckets || []).map((bucket) => bucket.bucket_date).filter(Boolean),
    [buckets]
  );
  const values = useMemo(
    () => rows.flatMap((row) => row.cells.map((cell) => cell.profit)),
    [rows]
  );
  const positiveThresholds = useMemo(
    () => buildQuantiles(values.filter((value) => value > 0)),
    [values]
  );
  const negativeThresholds = useMemo(
    () => buildQuantiles(values.filter((value) => value < 0).map((value) => Math.abs(value))),
    [values]
  );

  const width = LABEL_WIDTH + dates.length * (CELL_SIZE + CELL_GAP);
  const height = TOP_LABEL_HEIGHT + rows.length * ROW_HEIGHT;

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
        {activeCell && (
          <span className="analytics-widget-subtitle category-time-heatmap-active">
            {activeCell.category} - {activeCell.date}: {formatNumber(activeCell.profit, numberFormat)}
          </span>
        )}
      </div>

      {!rows.length || !dates.length ? (
        <div className="analytics-widget-empty">No category profit in this window.</div>
      ) : (
        <div className="category-time-heatmap-wrap">
          <svg
            className="category-time-heatmap-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Category profit heatmap over time"
          >
            {dates.map((date, index) => {
              const x = LABEL_WIDTH + index * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
              const shouldLabel = index % DATE_LABEL_INTERVAL === 0;

              return shouldLabel ? (
                <text
                  key={date}
                  className="category-time-heatmap-date"
                  transform={`translate(${x} ${TOP_LABEL_HEIGHT - 8}) rotate(-45)`}
                  textAnchor="end"
                >
                  {date}
                </text>
              ) : null;
            })}

            {rows.map((row, rowIndex) => {
              const y = TOP_LABEL_HEIGHT + rowIndex * ROW_HEIGHT;

              return (
                <g key={row.category}>
                  <text
                    className="category-time-heatmap-label"
                    x={LABEL_WIDTH - 10}
                    y={y + CELL_SIZE - 4}
                    textAnchor="end"
                  >
                    {row.category}
                  </text>
                  {row.cells.map((cell, cellIndex) => {
                    const x = LABEL_WIDTH + cellIndex * (CELL_SIZE + CELL_GAP);
                    const className = `category-time-heatmap-cell ${shadeClass(
                      cell.profit,
                      positiveThresholds,
                      negativeThresholds
                    )}`;
                    const active = {
                      category: row.category,
                      date: cell.date,
                      profit: cell.profit,
                    };

                    return (
                      <rect
                        key={`${row.category}-${cell.date}`}
                        className={className}
                        x={x}
                        y={y}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx="3"
                        tabIndex="0"
                        aria-label={cellLabel(row.category, cell.date, cell.profit, numberFormat)}
                        onMouseEnter={() => setActiveCell(active)}
                        onMouseLeave={() => setActiveCell(null)}
                        onFocus={() => setActiveCell(active)}
                        onBlur={() => setActiveCell(null)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
