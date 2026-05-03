import React from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  Treemap,
} from 'recharts';
import {
  computeInventoryByCategory,
  getCategoryColor,
} from '../../../utils/categoryAnalytics';
import { formatNumber } from '../../../utils/formatters';

const truncateLabel = (label, width) => {
  const maxChars = Math.max(4, Math.floor(width / 7));
  if (label.length <= maxChars) return label;
  return `${label.slice(0, Math.max(1, maxChars - 1))}.`;
};

function InventoryTooltip({ active, payload, numberFormat }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{row.name}</div>
      <div className="analytics-tooltip-row">
        <span>Funds tied up</span>
        <span className="analytics-tooltip-value">{formatNumber(row.value, numberFormat)}</span>
      </div>
    </div>
  );
}

function TreemapContent(props) {
  const {
    x,
    y,
    width,
    height,
    name,
    value,
  } = props;

  if (width <= 0 || height <= 0) return null;
  const label = truncateLabel(String(name || ''), width);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getCategoryColor(name)}
        stroke="rgb(15, 23, 42)"
      />
      {width > 64 && height > 36 && (
        <>
          <text className="category-treemap-label" x={x + 7} y={y + 18}>
            {label}
          </text>
          <text className="category-treemap-value" x={x + 7} y={y + 33}>
            {formatNumber(value, 'M')}
          </text>
        </>
      )}
    </g>
  );
}

export default function InventoryTreemap({ stocks = [], numberFormat }) {
  const data = computeInventoryByCategory(stocks);
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Current inventory cost basis by category from stock totals. Tile area is proportional to GP still tied up."
        >
          Funds tied up by category
        </h3>
        <span
          className="category-widget-total has-tooltip"
          data-tooltip="Total current cost basis still held across the visible categories."
        >
          Total {formatNumber(total, numberFormat)}
        </span>
      </div>
      {data.length === 0 ? (
        <div className="analytics-widget-empty">No current inventory.</div>
      ) : (
        <div className="analytics-widget-body analytics-chart-medium">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="value"
              aspectRatio={1.5}
              stroke="rgb(15, 23, 42)"
              content={<TreemapContent />}
            >
              <Tooltip content={<InventoryTooltip numberFormat={numberFormat} />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
