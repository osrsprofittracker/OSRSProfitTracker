import React from 'react';
import { DollarSign, Package, Repeat2, TrendingUp } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import '../../styles/home-page.css';

const formatDelta = (current, prior) => {
  if (prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
};

function KpiCard({ label, icon, value, deltaPct, numberFormat, valueClass = '' }) {
  const deltaClass = deltaPct == null
    ? 'is-neutral'
    : deltaPct >= 0 ? 'is-positive' : 'is-negative';

  const tooltip = {
    'Total Profit': 'All-time realized profit using the same accounting as the Trade and Home screens: item profit plus dump, referral, and bonds profit.',
    'Period Profit': 'Realized profit inside the selected analytics timeframe. On All, this uses the same total as Total Profit.',
    'GP Traded': 'Total GP value of transactions in the selected timeframe, including buys and sells.',
    'Inventory Value': 'Current GP cost basis of items still held in your tracked stock.',
  }[label] || `${label} for the current analytics view.`;

  return (
    <div
      className="summary-card has-tooltip"
      data-tooltip={tooltip}
    >
      <div className="summary-card-header">
        <span className="summary-card-icon analytics-kpi-icon">{icon}</span>
        <span className="summary-card-label">{label}</span>
      </div>
      <div className={`summary-card-value ${valueClass}`}>
        {formatNumber(value, numberFormat)}
      </div>
      {deltaPct != null && (
        <div className={`analytics-kpi-delta ${deltaClass}`}>
          {deltaPct >= 0 ? '+' : '-'}{Math.abs(deltaPct).toFixed(1)}% vs prior
        </div>
      )}
    </div>
  );
}

export default function KpiBand({
  totalProfit,
  periodProfit,
  priorPeriodProfit,
  gpTraded,
  priorGpTraded,
  inventoryValue,
  numberFormat,
  loading,
}) {
  if (loading) {
    return (
      <div className="analytics-kpi-band">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="summary-card analytics-kpi-skeleton">
            <div className="summary-card-label">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  const periodDelta = formatDelta(periodProfit, priorPeriodProfit);
  const gpDelta = formatDelta(gpTraded, priorGpTraded);

  return (
    <div className="analytics-kpi-band">
      <KpiCard
        label="Total Profit"
        icon={<DollarSign size={18} />}
        value={totalProfit}
        numberFormat={numberFormat}
        valueClass="profit-main-value"
      />
      <KpiCard
        label="Period Profit"
        icon={<TrendingUp size={18} />}
        value={periodProfit}
        deltaPct={periodDelta}
        numberFormat={numberFormat}
        valueClass="profit-main-value"
      />
      <KpiCard
        label="GP Traded"
        icon={<Repeat2 size={18} />}
        value={gpTraded}
        deltaPct={gpDelta}
        numberFormat={numberFormat}
        valueClass="gp-traded-main-value"
      />
      <KpiCard
        label="Inventory Value"
        icon={<Package size={18} />}
        value={inventoryValue}
        numberFormat={numberFormat}
        valueClass="inventory-main-value"
      />
    </div>
  );
}
