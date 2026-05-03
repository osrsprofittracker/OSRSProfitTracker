import React, { useMemo, useState } from 'react';
import { formatNumber } from '../../../utils/formatters';

const CELL = 10;
const GAP = 2;
const COLS = 53;
const ROWS = 7;
const SVG_WIDTH = COLS * (CELL + GAP) - GAP;
const SVG_HEIGHT = ROWS * (CELL + GAP) - GAP;

function parseIsoDateUtc(iso) {
  if (!iso) return new Date();
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const totalProfit = (bucket) => (
  Number(bucket.profit_items || 0)
  + Number(bucket.profit_dump || 0)
  + Number(bucket.profit_referral || 0)
  + Number(bucket.profit_bonds || 0)
);

function buildLast365Days(endIso) {
  const days = [];
  const end = endIso ? parseIsoDateUtc(endIso) : new Date();

  for (let index = 364; index >= 0; index -= 1) {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

function dayOfWeekOffset(iso) {
  return parseIsoDateUtc(iso).getUTCDay();
}

function quantiles(values, count) {
  const sorted = [...values].filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return [];

  const out = [];
  for (let index = 1; index <= count; index += 1) {
    const quantileIndex = Math.floor((sorted.length * index) / count) - 1;
    const clampedIndex = Math.max(0, Math.min(sorted.length - 1, quantileIndex));
    out.push(sorted[clampedIndex]);
  }
  return out;
}

function colorFor(profit, posSteps, negSteps) {
  if (profit === 0) return 'rgb(30, 41, 59)';

  if (profit > 0) {
    const idx = posSteps.findIndex((threshold) => profit <= threshold);
    const shadeIndex = idx === -1 ? posSteps.length - 1 : idx;
    const shades = ['#1f3b2c', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
    return shades[Math.min(Math.max(shadeIndex, 0), shades.length - 1)];
  }

  const idx = negSteps.findIndex((threshold) => Math.abs(profit) <= Math.abs(threshold));
  const shadeIndex = idx === -1 ? negSteps.length - 1 : idx;
  const shades = ['#3b1f24', '#7f1d1d', '#b91c1c', '#dc2626', '#f87171'];
  return shades[Math.min(Math.max(shadeIndex, 0), shades.length - 1)];
}

export default function ProfitHeatmap({
  allBuckets = [],
  endDate,
  numberFormat,
  onCellClick,
}) {
  const [hovered, setHovered] = useState(null);
  const days = useMemo(() => buildLast365Days(endDate), [endDate]);
  const startOffset = useMemo(() => (days.length ? dayOfWeekOffset(days[0]) : 0), [days]);
  const profitByDate = useMemo(() => {
    const map = new Map();
    for (const bucket of allBuckets) {
      map.set(bucket.bucket_date, totalProfit(bucket));
    }
    return map;
  }, [allBuckets]);
  const values = useMemo(
    () => days.map((date) => profitByDate.get(date) || 0),
    [days, profitByDate]
  );
  const posSteps = useMemo(() => quantiles(values, 5), [values]);
  const negSteps = useMemo(
    () => quantiles(values.filter((value) => value < 0).map((value) => Math.abs(value)), 5).map((value) => -value),
    [values]
  );

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Daily realized profit for the last 365 days. Brighter green is stronger profit; red is loss."
        >
          Profit heatmap (last 365 days)
        </h3>
        {hovered && (
          <span className="analytics-widget-subtitle">
            {hovered.date}: {formatNumber(hovered.profit, numberFormat)}
          </span>
        )}
      </div>
      <div className="analytics-heatmap-wrap">
        <svg
          className="analytics-heatmap-svg"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-label="Daily profit heatmap for the last 365 days"
        >
          {days.map((date, index) => {
            const profit = profitByDate.get(date) || 0;
            const gridIndex = index + startOffset;
            const x = Math.floor(gridIndex / ROWS) * (CELL + GAP);
            const y = (gridIndex % ROWS) * (CELL + GAP);

            return (
              <rect
                key={date}
                className="analytics-heatmap-cell"
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx="2"
                fill={colorFor(profit, posSteps, negSteps)}
                tabIndex="0"
                role="button"
                aria-label={`${date}: ${formatNumber(profit, numberFormat)}`}
                onMouseEnter={() => setHovered({ date, profit })}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered({ date, profit })}
                onBlur={() => setHovered(null)}
                onClick={() => onCellClick?.(date)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCellClick?.(date);
                  }
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
