import React from 'react';
import { Plus } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { calculateStocksProfit, calculateTotalProfit } from '../utils/calculations';
import { calculateUnrealizedProfit } from '../utils/taxUtils';

export default function PortfolioSummary({
  stocks,
  dumpProfit,
  referralProfit,
  bondsProfit,
  visibleProfits = { dumpProfit: true, referralProfit: true, bondsProfit: true },
  onAddDumpProfit,
  onAddReferralProfit,
  onAddBondsProfit,
  numberFormat,
  geData = {},
  showUnrealisedProfitStats = false
}) {
  const stocksProfit = calculateStocksProfit(stocks);
  const totalProfit = calculateTotalProfit(stocks, dumpProfit, referralProfit, bondsProfit);

  const totalUnrealised = showUnrealisedProfitStats
    ? stocks.reduce((sum, s) => {
        const high = s.itemId ? geData[s.itemId]?.high : null;
        const val = calculateUnrealizedProfit(s, high, s.itemId);
        return sum + (val ?? 0);
      }, 0)
    : null;

  const totalPortfolio = stocks.reduce((sum, s) => sum + s.totalCost, 0);
  const totalShares = stocks.reduce((sum, s) => sum + s.shares, 0);
  const totalSales = stocks.reduce((sum, s) => sum + s.totalCostSold, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Top Row - 4 items */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Total Portfolio Value */}
        <SummaryCard
          label="Total Portfolio:"
          value={formatNumber(totalPortfolio)}
          color="rgb(96, 165, 250)"
          tooltip="GP invested across all items you hold"
        />

        {/* Total Shares */}
        <SummaryCard
          label="Total Stock:"
          value={formatNumber(totalShares)}
          color="rgb(251, 146, 60)"
          tooltip="Total items you currently hold"
        />

        {/* Total Sales */}
        <SummaryCard
          label="Total Revenue:"
          value={formatNumber(totalSales)}
          color="rgb(168, 85, 247)"
          tooltip="GP received from all sales"
        />

        {/* Total Profit */}
        <SummaryCard
          label="Total Profit:"
          value={formatNumber(totalProfit)}
          color={totalProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
          tooltip="Stocks + dumps + referrals + bonds profit combined"
        />
      </div>

      {/* Bottom Row - 4 items */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Stock Profit */}
        <SummaryCard
          label="Stock Profit:"
          value={formatNumber(stocksProfit)}
          color={stocksProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
          tooltip="Profit from flipping items"
        />

        {/* Dump Profit */}
        {visibleProfits?.dumpProfit !== false && (
          <SummaryCard
            label="Dump Profit:"
            value={formatNumber(dumpProfit)}
            color="rgb(52, 211, 153)"
            tooltip="Profit from item dumps"
            button={{
              onClick: onAddDumpProfit,
              color: 'rgb(5, 150, 105)',
              hoverColor: 'rgb(4, 120, 87)'
            }}
          />
        )}

        {/* Referral Profit */}
        {visibleProfits?.referralProfit !== false && (
          <SummaryCard
            label="Referral Profit:"
            value={formatNumber(referralProfit)}
            color="rgb(168, 85, 247)"
            tooltip="Profit from referrals"
            button={{
              onClick: onAddReferralProfit,
              color: 'rgb(126, 34, 206)',
              hoverColor: 'rgb(107, 33, 168)'
            }}
          />
        )}

        {/* Bonds Profit */}
        {visibleProfits?.bondsProfit !== false && (
          <SummaryCard
            label="Bonds Profit:"
            value={formatNumber(bondsProfit)}
            color="rgb(234, 179, 8)"
            tooltip="Profit from bond flips"
            button={{
              onClick: onAddBondsProfit,
              color: 'rgb(161, 98, 7)',
              hoverColor: 'rgb(133, 77, 14)'
            }}
          />
        )}

        {/* Unrealised Profit */}
        {showUnrealisedProfitStats && (
          <SummaryCard
            label="Unrealised Profit:"
            value={`${totalUnrealised >= 0 ? '+' : ''}${formatNumber(totalUnrealised, numberFormat)}`}
            color={totalUnrealised >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
            tooltip="Estimated profit if sold at GE high (after 2% tax)"
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, button, tooltip }) {
  return (
    <div title={tooltip} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      border: '1px solid rgb(71, 85, 105)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
        {label}
      </span>
      <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color, minWidth: '120px', textAlign: 'center' }}>
        {value}
      </span>
      {button && (
        <button
          onClick={button.onClick}
          style={{
            padding: '0.5rem 1rem',
            background: button.color,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = button.hoverColor}
          onMouseOut={(e) => e.currentTarget.style.background = button.color}
        >
          <Plus size={18} /> Add
        </button>
      )}
    </div>
  );
}