import React from 'react';
import { formatNumber } from '../../../utils/formatters';

const sumSells = (buckets = []) => buckets.reduce((sum, bucket) => sum + Number(bucket.sells_count || 0), 0);
const sumWins = (buckets = []) => buckets.reduce((sum, bucket) => sum + Number(bucket.wins_count || 0), 0);
const sumProfitItems = (buckets = []) => buckets.reduce((sum, bucket) => sum + Number(bucket.profit_items || 0), 0);
const sumGp = (buckets = []) => buckets.reduce((sum, bucket) => sum + Number(bucket.gp_traded || 0), 0);

const fmtPct = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}%` : '-');
const pctDelta = (current, prior) => (prior > 0 ? ((current - prior) / Math.abs(prior)) * 100 : null);

function Mini({ label, value, delta, tooltip }) {
  const deltaClass = delta == null ? '' : delta >= 0 ? ' is-positive' : ' is-negative';

  return (
    <div className="analytics-kpi-mini has-tooltip" data-tooltip={tooltip}>
      <div className="analytics-kpi-mini-label">{label}</div>
      <div className="analytics-kpi-mini-value">{value}</div>
      {delta != null && (
        <div className={`analytics-kpi-mini-delta${deltaClass}`}>
          {delta >= 0 ? '+' : '-'}{Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export default function ProfitKpiStrip({ currentBuckets = [], priorBuckets = [], numberFormat }) {
  const sells = sumSells(currentBuckets);
  const wins = sumWins(currentBuckets);
  const itemProfit = sumProfitItems(currentBuckets);
  const gp = sumGp(currentBuckets);

  const priorSells = sumSells(priorBuckets);
  const priorWins = sumWins(priorBuckets);
  const priorItemProfit = sumProfitItems(priorBuckets);
  const priorGp = sumGp(priorBuckets);

  const avgPerSell = sells > 0 ? itemProfit / sells : 0;
  const priorAvgPerSell = priorSells > 0 ? priorItemProfit / priorSells : 0;
  const avgMargin = gp > 0 ? (itemProfit / gp) * 100 : 0;
  const priorAvgMargin = priorGp > 0 ? (priorItemProfit / priorGp) * 100 : 0;
  const winRate = sells > 0 ? (wins / sells) * 100 : 0;
  const priorWinRate = priorSells > 0 ? (priorWins / priorSells) * 100 : 0;

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Sell quality metrics for the selected timeframe."
        >
          Profit KPIs
        </h3>
      </div>
      <div className="analytics-kpi-strip">
        <Mini
          label="Avg / sell"
          value={formatNumber(Math.round(avgPerSell), numberFormat)}
          delta={pctDelta(avgPerSell, priorAvgPerSell)}
          tooltip="Average item profit per sell transaction in the selected timeframe. Delta compares against the immediately previous timeframe of the same length."
        />
        <Mini
          label="Avg margin"
          value={fmtPct(avgMargin)}
          delta={pctDelta(avgMargin, priorAvgMargin)}
          tooltip="Item profit divided by GP traded in the selected timeframe. Delta compares against the immediately previous timeframe of the same length."
        />
        <Mini
          label="Win rate"
          value={fmtPct(winRate)}
          delta={pctDelta(winRate, priorWinRate)}
          tooltip="Percentage of sell profit entries above zero in the selected timeframe. Delta compares against the immediately previous timeframe of the same length."
        />
      </div>
    </div>
  );
}
