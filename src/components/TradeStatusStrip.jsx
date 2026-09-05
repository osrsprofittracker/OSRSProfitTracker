import React, { useMemo } from 'react';
import { Package, TrendingUp, Wallet, CircleDollarSign } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { calculateUnrealizedProfit } from '../utils/taxUtils';
import '../styles/trade-status-strip.css';

function TradeStatusItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="trade-status-item">
      <div className="trade-status-icon">
        <Icon size={16} />
      </div>
      <div className="trade-status-copy">
        <span className="trade-status-label">{label}</span>
        <span className={`trade-status-value ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}

export default function TradeStatusStrip({
  stocks = [],
  gePrices = {},
  numberFormat,
  children,
}) {
  const stats = useMemo(() => {
    const totalPortfolio = stocks.reduce((sum, stock) => sum + (stock.totalCost || 0), 0);
    const totalProfit = stocks.reduce(
      (sum, stock) => sum + ((stock.totalCostSold || 0) - (stock.totalCostBasisSold || 0)),
      0
    );
    const totalQuantity = stocks.reduce((sum, stock) => sum + (stock.shares || 0), 0);
    const unrealisedProfit = stocks.reduce((sum, stock) => {
      const latestHigh = stock.itemId ? gePrices?.[stock.itemId]?.high : null;
      return sum + (calculateUnrealizedProfit(stock, latestHigh, stock.itemId) ?? 0);
    }, 0);

    return { totalPortfolio, totalProfit, totalQuantity, unrealisedProfit };
  }, [stocks, gePrices]);

  return (
    <section className="trade-status-overview" aria-label="Trade overview">
      <div className="trade-status-strip">
        <TradeStatusItem
          icon={Wallet}
          label="Total Portfolio"
          value={formatNumber(stats.totalPortfolio, numberFormat)}
        />
        <TradeStatusItem
          icon={TrendingUp}
          label="Total Profit"
          value={`${stats.totalProfit >= 0 ? '+' : ''}${formatNumber(stats.totalProfit, numberFormat)}`}
          valueClass={stats.totalProfit >= 0 ? 'positive' : 'negative'}
        />
        <TradeStatusItem
          icon={Package}
          label="Total Quantity"
          value={formatNumber(stats.totalQuantity, 'full')}
        />
        <TradeStatusItem
          icon={CircleDollarSign}
          label="Unrealised Profit"
          value={`${stats.unrealisedProfit >= 0 ? '+' : ''}${formatNumber(stats.unrealisedProfit, numberFormat)}`}
          valueClass={stats.unrealisedProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {children && (
        <div className="trade-status-companion-row">
          {children}
        </div>
      )}
    </section>
  );
}
