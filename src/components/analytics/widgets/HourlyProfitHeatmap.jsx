import React, { useMemo, useRef } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { formatLocalDate } from '../../../utils/localPeriods';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};
const CELL_WIDTH = 32;
const CELL_HEIGHT = 22;
const CELL_GAP = 3;
const LABEL_WIDTH = 42;
const TOP_LABEL_HEIGHT = 24;
const SVG_WIDTH = LABEL_WIDTH + 24 * (CELL_WIDTH + CELL_GAP) - CELL_GAP;
const SVG_HEIGHT = TOP_LABEL_HEIGHT + 7 * (CELL_HEIGHT + CELL_GAP) - CELL_GAP;
const TOOLTIP_WIDTH = 176;
const TOOLTIP_HEIGHT = 58;

const getProfitType = (profit) => profit.profit_type ?? profit.profitType;
const getProfitTxId = (profit) => profit.transaction_id ?? profit.transactionId;

function buildThresholds(values, count = 5) {
  const sorted = [...values].filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return [];

  return Array.from({ length: count }, (_, index) => {
    const quantileIndex = Math.ceil((sorted.length * (index + 1)) / count) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, quantileIndex))];
  });
}

function colorFor(value, positiveThresholds, negativeThresholds) {
  if (value === 0) return 'rgb(30, 41, 59)';

  if (value > 0) {
    const index = positiveThresholds.findIndex((threshold) => value <= threshold);
    const shade = index === -1 ? positiveThresholds.length - 1 : index;
    return ['#1f3b2c', '#15803d', '#16a34a', '#22c55e', '#4ade80'][Math.max(0, Math.min(4, shade))];
  }

  const magnitude = Math.abs(value);
  const index = negativeThresholds.findIndex((threshold) => magnitude <= threshold);
  const shade = index === -1 ? negativeThresholds.length - 1 : index;
  return ['#3b1f24', '#7f1d1d', '#b91c1c', '#dc2626', '#f87171'][Math.max(0, Math.min(4, shade))];
}

function hourLabel(hour) {
  const next = (hour + 1) % 24;
  return `${String(hour).padStart(2, '0')}:00-${String(next).padStart(2, '0')}:00`;
}

function tooltipPosition(x, y) {
  const rightSide = x + CELL_WIDTH + 8;
  const leftSide = x - TOOLTIP_WIDTH - 8;
  const tooltipX = rightSide + TOOLTIP_WIDTH <= SVG_WIDTH ? rightSide : Math.max(LABEL_WIDTH, leftSide);

  return {
    x: tooltipX,
    y: Math.max(0, Math.min(SVG_HEIGHT - TOOLTIP_HEIGHT, y - 16)),
  };
}

function buildProfitByTransaction(profitHistory = []) {
  const map = new Map();

  for (const profit of profitHistory || []) {
    if (getProfitType(profit) !== 'stock') continue;

    const txId = getProfitTxId(profit);
    if (txId == null) continue;

    const key = String(txId);
    map.set(key, (map.get(key) || 0) + (Number(profit.amount) || 0));
  }

  return map;
}

function createEmptyRows() {
  const cells = new Map();

  for (const dayIndex of DAY_ORDER) {
    for (let hour = 0; hour < 24; hour += 1) {
      cells.set(`${dayIndex}-${hour}`, {
        dayIndex,
        hour,
        profit: 0,
        sellCount: 0,
      });
    }
  }

  return cells;
}

function rowsFromCells(cells) {
  return DAY_ORDER.map((dayIndex) => ({
    dayIndex,
    label: DAY_LABELS[dayIndex],
    cells: Array.from({ length: 24 }, (_, hour) => cells.get(`${dayIndex}-${hour}`)),
  }));
}

function addSellToCells({ cells, transaction, profit, startDate, endDate }) {
  if (!transaction?.date) return;

  const localDate = formatLocalDate(transaction.date);
  if (startDate && localDate < startDate) return;
  if (endDate && localDate > endDate) return;

  const date = new Date(transaction.date);
  if (Number.isNaN(date.getTime())) return;

  const dayIndex = date.getDay();
  const hour = date.getHours();
  const cell = cells.get(`${dayIndex}-${hour}`);
  if (!cell) return;

  cell.profit += Number(profit) || 0;
  cell.sellCount += 1;
}

function buildCellsFromTransactions({ transactions, profitHistory, startDate, endDate }) {
  const cells = createEmptyRows();
  const profitByTransaction = buildProfitByTransaction(profitHistory);

  for (const transaction of transactions || []) {
    if (transaction.type !== 'sell') continue;

    const txKey = String(transaction.id);
    const profit = transaction.profit ?? profitByTransaction.get(txKey);
    if (profit == null) continue;

    addSellToCells({
      cells,
      transaction,
      profit,
      startDate,
      endDate,
    });
  }

  return rowsFromCells(cells);
}

function buildCells({ transactions, profitHistory, startDate, endDate }) {
  return buildCellsFromTransactions({
    transactions,
    profitHistory,
    startDate,
    endDate,
  });
}

export default function HourlyProfitHeatmap({
  transactions = [],
  profitHistory = [],
  timeframe,
  numberFormat,
  onCellClick,
}) {
  const tooltipRef = useRef(null);
  const tooltipTitleRef = useRef(null);
  const tooltipProfitRef = useRef(null);
  const tooltipStatsRef = useRef(null);
  const activeCellLabelRef = useRef(null);
  const rows = useMemo(
    () => buildCells({
      transactions,
      profitHistory,
      startDate: timeframe?.start,
      endDate: timeframe?.end,
    }),
    [transactions, profitHistory, timeframe?.start, timeframe?.end]
  );
  const values = useMemo(
    () => rows.flatMap((row) => row.cells.map((cell) => cell.profit)),
    [rows]
  );
  const positiveThresholds = useMemo(
    () => buildThresholds(values.filter((value) => value > 0)),
    [values]
  );
  const negativeThresholds = useMemo(
    () => buildThresholds(values.filter((value) => value < 0).map((value) => Math.abs(value))),
    [values]
  );

  const showCellDetail = (cell, x, y) => {
    const profit = Number(cell.profit) || 0;
    const sellCount = Number(cell.sellCount) || 0;
    const average = sellCount > 0 ? profit / sellCount : 0;
    const title = `${DAY_LABELS[cell.dayIndex]} ${hourLabel(cell.hour)}`;
    const stats = `${sellCount} sells - avg ${formatNumber(average, numberFormat)}`;
    const tooltip = tooltipPosition(x, y);

    if (tooltipRef.current) {
      tooltipRef.current.setAttribute('transform', `translate(${tooltip.x} ${tooltip.y})`);
      tooltipRef.current.classList.add('is-visible');
    }
    if (tooltipTitleRef.current) tooltipTitleRef.current.textContent = title;
    if (tooltipProfitRef.current) {
      tooltipProfitRef.current.textContent = formatNumber(profit, numberFormat);
      tooltipProfitRef.current.setAttribute('class', profit < 0 ? 'is-negative' : 'is-positive');
    }
    if (tooltipStatsRef.current) tooltipStatsRef.current.textContent = stats;
    if (activeCellLabelRef.current) {
      activeCellLabelRef.current.textContent = `${title}: ${formatNumber(profit, numberFormat)} across ${sellCount} sells`;
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
            data-tooltip="Realized stock profit grouped by transaction timestamp in your local timezone. Rows are weekdays and columns are local hours."
          >
            Profit by weekday and hour
          </h3>
          <p className="analytics-widget-subtitle">
            Local timezone grouping for the selected timeframe.
          </p>
        </div>
        <span
          ref={activeCellLabelRef}
          className="analytics-widget-subtitle hourly-profit-heatmap-active"
          aria-live="polite"
        />
      </div>
      <div className="hourly-profit-heatmap-wrap">
        <svg
          className="hourly-profit-heatmap-svg"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          role="img"
          aria-label="Realized profit by weekday and local hour"
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <text
              key={hour}
              className="hourly-profit-heatmap-hour"
              x={LABEL_WIDTH + hour * (CELL_WIDTH + CELL_GAP) + CELL_WIDTH / 2}
              y={16}
              textAnchor="middle"
            >
              {hour}
            </text>
          ))}
          {rows.map((row, rowIndex) => {
            const y = TOP_LABEL_HEIGHT + rowIndex * (CELL_HEIGHT + CELL_GAP);

            return (
              <g key={row.dayIndex}>
                <text
                  className="hourly-profit-heatmap-day"
                  x={LABEL_WIDTH - 10}
                  y={y + 15}
                  textAnchor="end"
                >
                  {row.label}
                </text>
                {row.cells.map((cell, hour) => {
                  const x = LABEL_WIDTH + hour * (CELL_WIDTH + CELL_GAP);
                  const label = `${DAY_LABELS[cell.dayIndex]} ${hourLabel(cell.hour)}: ${formatNumber(cell.profit, numberFormat)}, ${cell.sellCount} sells`;

                  return (
                    <rect
                      key={`${row.dayIndex}-${hour}`}
                      className="hourly-profit-heatmap-cell"
                      x={x}
                      y={y}
                      width={CELL_WIDTH}
                      height={CELL_HEIGHT}
                      rx="3"
                      fill={colorFor(cell.profit, positiveThresholds, negativeThresholds)}
                      tabIndex="0"
                      role="button"
                      aria-label={label}
                      onMouseEnter={() => showCellDetail(cell, x, y)}
                      onMouseLeave={hideCellDetail}
                      onFocus={() => showCellDetail(cell, x, y)}
                      onBlur={hideCellDetail}
                      onClick={() => onCellClick?.(cell)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onCellClick?.(cell);
                        }
                      }}
                    />
                  );
                })}
              </g>
            );
          })}
          <g ref={tooltipRef} className="hourly-profit-heatmap-tooltip">
            <rect width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="6" />
            <text ref={tooltipTitleRef} x="8" y="15" />
            <text ref={tooltipProfitRef} x="8" y="32" />
            <text ref={tooltipStatsRef} x="8" y="49" className="is-muted" />
          </g>
        </svg>
      </div>
    </div>
  );
}
