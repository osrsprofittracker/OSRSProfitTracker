import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const DEFAULT_VISIBLE = 10;

function NetTooltip({ active, payload, numberFormat }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{row.name}</div>
      <div className="analytics-tooltip-row">
        <span>Buy basis</span>
        <span className="analytics-tooltip-value">{formatNumber(row.buys, numberFormat)}</span>
      </div>
      <div className="analytics-tooltip-row">
        <span>Sells</span>
        <span className="analytics-tooltip-value">{formatNumber(row.sells, numberFormat)}</span>
      </div>
      <div className="analytics-tooltip-row">
        <span>Net</span>
        <span className="analytics-tooltip-value">{formatNumber(row.net, numberFormat)}</span>
      </div>
    </div>
  );
}

const domainFor = (rows) => {
  const values = rows.map((row) => Number(row.net) || 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);

  if (min < 0 && max > 0) return [min, max];
  if (min < 0) return [min, 0];
  return [0, max || 1];
};

function DirectionChart({ heading, tooltip, rows, numberFormat, fill }) {
  if (!rows.length) {
    return (
      <div className="items-direction-panel">
        <h4 className="items-direction-title has-tooltip" data-tooltip={tooltip}>{heading}</h4>
        <div className="analytics-widget-empty">No matching activity.</div>
      </div>
    );
  }

  return (
    <div className="items-direction-panel">
      <h4 className="items-direction-title has-tooltip" data-tooltip={tooltip}>{heading}</h4>
      <div className="items-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis
              type="number"
              domain={domainFor(rows)}
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              tickFormatter={(value) => formatNumber(value, numberFormat)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgb(148, 163, 184)"
              fontSize={11}
              width={120}
            />
            <ReferenceLine x={0} stroke="rgb(71, 85, 105)" />
            <Tooltip content={<NetTooltip numberFormat={numberFormat} />} />
            <Bar dataKey="net" fill={fill} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function BuyingVsSellingChart({ rows = [], numberFormat }) {
  const [showAll, setShowAll] = useState(false);
  const { sellers, buyers } = useMemo(() => ({
    sellers: rows
      .filter((row) => row.net > 0)
      .sort((a, b) => b.net - a.net),
    buyers: rows
      .filter((row) => row.net < 0)
      .sort((a, b) => a.net - b.net),
  }), [rows]);

  const visibleSellers = showAll ? sellers : sellers.slice(0, DEFAULT_VISIBLE);
  const visibleBuyers = showAll ? buyers : buyers.slice(0, DEFAULT_VISIBLE);
  const canToggle = sellers.length > DEFAULT_VISIBLE || buyers.length > DEFAULT_VISIBLE;

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <div>
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Per-item all-time sold GP minus accounted buy cost basis. Sold GP matches Total Sold Price in the trade screen."
          >
            Buying vs selling
          </h3>
          <p
            className="analytics-widget-subtitle has-tooltip"
            data-tooltip="Buy basis is current held cost plus sold cost basis. Net sellers and buyers respect the active item filters."
          >
            Sold GP minus buy basis
          </p>
        </div>
        {canToggle && (
          <button
            type="button"
            className="analytics-toggle has-tooltip"
            onClick={() => setShowAll((value) => !value)}
            data-tooltip="Show or hide all items with buy/sell activity in this timeframe."
          >
            {showAll ? 'Show less' : `Show all (${rows.length})`}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="analytics-widget-empty">No buy or sell activity in this window.</div>
      ) : (
        <div className="items-direction-grid">
          <DirectionChart
            heading="Net sellers"
            tooltip="Items where all-time sold GP is higher than accounted buy cost basis."
            rows={visibleSellers}
            numberFormat={numberFormat}
            fill="rgb(34, 197, 94)"
          />
          <DirectionChart
            heading="Net buyers"
            tooltip="Items where accounted buy cost basis is higher than all-time sold GP."
            rows={visibleBuyers}
            numberFormat={numberFormat}
            fill="rgb(96, 165, 250)"
          />
        </div>
      )}
    </div>
  );
}
