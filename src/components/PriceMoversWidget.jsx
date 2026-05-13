import React, { useMemo, useState } from 'react';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { useGEPriceBaseline } from '../hooks/useGEPriceBaseline';
import { formatNumber } from '../utils/formatters';

const MAX_MOVERS = 6;

function formatPercent(value) {
  if (!Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function signedNumber(value, numberFormat) {
  if (!Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, numberFormat)}`;
}

function priceOf(entry) {
  return Number(entry?.avgHighPrice ?? entry?.high ?? 0);
}

export default function PriceMoversWidget({
  stocks = [],
  gePrices = {},
  numberFormat = 'compact',
}) {
  const [activeView, setActiveView] = useState('impact');
  const [hideOneGpMoves, setHideOneGpMoves] = useState(true);
  const { baselinePrices, baselineTimestamp, loading, error } = useGEPriceBaseline();

  const movers = useMemo(() => {
    if (!stocks?.length || !gePrices || !baselinePrices) return [];

    return stocks
      .filter(stock => !stock.archived && stock.shares > 0 && stock.itemId)
      .map(stock => {
        const itemId = String(stock.itemId);
        const currentHigh = Number(gePrices[itemId]?.high ?? 0);
        const baselineHigh = priceOf(baselinePrices[itemId]);

        if (currentHigh <= 0 || baselineHigh <= 0) return null;

        const priceDelta = currentHigh - baselineHigh;
        const percentMove = (priceDelta / baselineHigh) * 100;
        const impactMove = priceDelta * stock.shares;

        if (!Number.isFinite(percentMove) || priceDelta === 0) return null;
        if (hideOneGpMoves && Math.abs(priceDelta) <= 1) return null;

        return {
          id: stock.id,
          name: stock.name,
          shares: stock.shares,
          currentHigh,
          baselineHigh,
          priceDelta,
          percentMove,
          impactMove,
        };
      })
      .filter(Boolean);
  }, [stocks, gePrices, baselinePrices, hideOneGpMoves]);

  const sortedMovers = useMemo(() => {
    const sortKey = activeView === 'impact' ? 'impactMove' : 'percentMove';
    return [...movers]
      .sort((a, b) => Math.abs(b[sortKey]) - Math.abs(a[sortKey]))
      .slice(0, MAX_MOVERS);
  }, [movers, activeView]);

  const baselineLabel = baselineTimestamp
    ? new Date(baselineTimestamp * 1000).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : null;

  const renderBody = () => {
    if (loading) {
      return <p className="activity-empty">Loading 24h price baseline...</p>;
    }

    if (error) {
      return <p className="activity-empty">24h price movement is unavailable right now.</p>;
    }

    if (!stocks.some(stock => !stock.archived && stock.shares > 0 && stock.itemId)) {
      return <p className="activity-empty">No held GE-linked items to compare.</p>;
    }

    if (sortedMovers.length === 0) {
      return <p className="activity-empty">No held items have a usable 24h price move yet.</p>;
    }

    return (
      <div className="price-movers-list">
        {sortedMovers.map((mover) => {
          const isUp = mover.priceDelta > 0;
          const DirectionIcon = isUp ? TrendingUp : TrendingDown;
          const valueClass = isUp ? 'price-mover-positive' : 'price-mover-negative';

          return (
            <div key={mover.id} className="price-mover-row">
              <div className="price-mover-main">
                <div className="price-mover-title-row">
                  <DirectionIcon size={16} className={valueClass} />
                  <span className="price-mover-name">{mover.name}</span>
                </div>
                <div className="price-mover-subtitle">
                  {formatNumber(mover.shares, numberFormat)} held - GE High {formatNumber(mover.baselineHigh, numberFormat)} to {formatNumber(mover.currentHigh, numberFormat)}
                </div>
              </div>
              <div className="price-mover-values">
                <div className={`price-mover-primary ${valueClass}`}>
                  {activeView === 'impact'
                    ? signedNumber(mover.impactMove, numberFormat)
                    : formatPercent(mover.percentMove)}
                </div>
                <div className="price-mover-secondary">
                  {activeView === 'impact'
                    ? formatPercent(mover.percentMove)
                    : signedNumber(mover.impactMove, numberFormat)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="activity-section price-movers-section">
      <div className="price-movers-header">
        <h3 className="activity-section-title price-movers-title">
          <Activity size={20} />
          Price Movers
        </h3>
        <div className="price-movers-tabs" aria-label="Price mover sorting">
          <button
            type="button"
            className={`price-movers-tab ${activeView === 'impact' ? 'price-movers-tab-active' : ''}`}
            onClick={() => setActiveView('impact')}
          >
            Impact
          </button>
          <button
            type="button"
            className={`price-movers-tab ${activeView === 'percent' ? 'price-movers-tab-active' : ''}`}
            onClick={() => setActiveView('percent')}
          >
            %
          </button>
        </div>
      </div>
      <label className="price-movers-filter">
        <input
          type="checkbox"
          checked={hideOneGpMoves}
          onChange={(event) => setHideOneGpMoves(event.target.checked)}
        />
        Hide 1 GP moves
      </label>
      <div className="price-movers-meta">
        Held items only - compared with {baselineLabel || '24h ago'}
      </div>
      {renderBody()}
    </div>
  );
}
