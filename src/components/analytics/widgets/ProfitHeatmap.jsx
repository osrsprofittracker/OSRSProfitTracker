import React, { useMemo, useRef } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { parseIsoDateUtc, totalProfit } from '../../../utils/analyticsHelpers';

const CELL = 10;
const GAP = 2;
const COLS = 53;
const ROWS = 7;
const SVG_WIDTH = COLS * (CELL + GAP) - GAP;
const SVG_HEIGHT = ROWS * (CELL + GAP) - GAP;
const TOOLTIP_WIDTH = 112;
const TOOLTIP_HEIGHT = 36;
const TOOLTIP_TEXT_SIZE = 10;

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

function tooltipPosition(x, y, width, height) {
  const rightSide = x + CELL + 7;
  const leftSide = x - width - 7;
  const tooltipX = rightSide + width <= SVG_WIDTH ? rightSide : Math.max(0, leftSide);

  return {
    x: tooltipX,
    y: Math.max(0, Math.min(SVG_HEIGHT - height, y - Math.floor((height - CELL) / 2))),
  };
}

export default function ProfitHeatmap({
  allBuckets = [],
  endDate,
  numberFormat,
  onCellClick,
}) {
  const tooltipRef = useRef(null);
  const tooltipRectRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipDateRef = useRef(null);
  const tooltipProfitRef = useRef(null);
  const activeCellLabelRef = useRef(null);
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
  const showCellDetail = (cell) => {
    const profit = Number(cell.profit) || 0;
    const svgWidth = svgRef.current?.getBoundingClientRect().width || SVG_WIDTH;
    const scale = Math.max(1, svgWidth / SVG_WIDTH);
    const tooltipWidth = TOOLTIP_WIDTH / scale;
    const tooltipHeight = TOOLTIP_HEIGHT / scale;
    const tooltipTextSize = TOOLTIP_TEXT_SIZE / scale;
    const tooltip = tooltipPosition(cell.x, cell.y, tooltipWidth, tooltipHeight);

    if (tooltipRef.current) {
      tooltipRef.current.setAttribute('transform', `translate(${tooltip.x} ${tooltip.y})`);
      tooltipRef.current.classList.add('is-visible');
    }
    if (tooltipRectRef.current) {
      tooltipRectRef.current.setAttribute('width', tooltipWidth);
      tooltipRectRef.current.setAttribute('height', tooltipHeight);
      tooltipRectRef.current.setAttribute('rx', 6 / scale);
    }
    if (tooltipDateRef.current) tooltipDateRef.current.textContent = cell.date;
    if (tooltipProfitRef.current) {
      tooltipProfitRef.current.textContent = formatNumber(profit, numberFormat);
      tooltipProfitRef.current.setAttribute('class', profit < 0 ? 'is-negative' : 'is-positive');
    }
    tooltipDateRef.current?.setAttribute('font-size', tooltipTextSize);
    tooltipProfitRef.current?.setAttribute('font-size', tooltipTextSize);
    tooltipDateRef.current?.setAttribute('x', 7 / scale);
    tooltipDateRef.current?.setAttribute('y', 13 / scale);
    tooltipProfitRef.current?.setAttribute('x', 7 / scale);
    tooltipProfitRef.current?.setAttribute('y', 28 / scale);
    if (activeCellLabelRef.current) {
      activeCellLabelRef.current.textContent = `${cell.date}: ${formatNumber(profit, numberFormat)}`;
    }
  };

  const hideCellDetail = () => {
    tooltipRef.current?.classList.remove('is-visible');
    if (activeCellLabelRef.current) activeCellLabelRef.current.textContent = '';
  };

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Daily realized profit for the last 365 days. Brighter green is stronger profit; red is loss."
        >
          Profit heatmap (last 365 days)
        </h3>
        <span
          ref={activeCellLabelRef}
          className="analytics-widget-subtitle analytics-heatmap-active"
          aria-live="polite"
        />
      </div>
      <div className="analytics-heatmap-wrap">
        <svg
          ref={svgRef}
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
            const active = {
              date,
              profit,
              x,
              y,
            };

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
                onMouseEnter={() => showCellDetail(active)}
                onMouseLeave={hideCellDetail}
                onFocus={() => showCellDetail(active)}
                onBlur={hideCellDetail}
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
          <g ref={tooltipRef} className="analytics-heatmap-svg-tooltip">
            <rect ref={tooltipRectRef} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="6" />
            <text ref={tooltipDateRef} x="7" y="13" />
            <text ref={tooltipProfitRef} x="7" y="28" />
          </g>
        </svg>
      </div>
    </div>
  );
}
