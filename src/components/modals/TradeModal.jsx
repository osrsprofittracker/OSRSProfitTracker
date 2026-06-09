import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Check, Repeat2, X } from 'lucide-react';
import { formatNumber, parseMK, handleMKInput } from '../../utils/formatters';
import { useGEData } from '../../contexts/GEDataContext';
import '../../styles/trade-modal.css';

export default function TradeModal({ stock, mode, onConfirm, onCancel, isSubmitting = false }) {
  const isBuy = mode === 'buy';
  const { gePrices: geData } = useGEData();

  const [shares, setShares] = useState(isBuy ? (stock.limit4h * 1).toString() : '');
  const [price, setPrice] = useState('');
  const [useTotal, setUseTotal] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [targetSellValue, setTargetSellValue] = useState('');
  const [startTimer, setStartTimer] = useState(true);
  const [multiplier, setMultiplier] = useState(1);

  const geLow = stock.itemId ? geData[stock.itemId]?.low : null;
  const geHigh = stock.itemId ? geData[stock.itemId]?.high : null;

  // Seed price (and totalAmount when shares are present) from avg buy/sell
  useEffect(() => {
    const avg = isBuy
      ? (stock.shares > 0 ? stock.totalCost / stock.shares : 0)
      : (stock.sharesSold > 0 ? stock.totalCostSold / stock.sharesSold : 0);
    const avgPrice = (Math.round(avg * 100) / 100).toFixed(0);
    setPrice(avgPrice);
    if (isBuy) {
      setTotalAmount((stock.limit4h * parseFloat(avgPrice)).toFixed(0));
    } else if (stock.shares > 0) {
      // Sell: seed totalAmount based on currently held shares so toggle works without first edit
      setTotalAmount((stock.shares * parseFloat(avgPrice)).toFixed(0));
    }
  }, [stock, isBuy]);

  const handleSharesBlur = () => {
    const parsed = parseMK(shares);
    setShares(parsed);
    if (price && parsed) {
      setTotalAmount((parseFloat(parsed) * parseFloat(price)).toFixed(0));
    }
  };

  const handleMultiplierChange = (mult) => {
    setMultiplier(mult);
    const newShares = stock.limit4h * mult;
    setShares(newShares.toString());
    if (price) {
      setTotalAmount((newShares * parseFloat(price)).toFixed(0));
    }
  };

  const handleModeToggle = () => {
    if (!useTotal && price && shares) {
      setTotalAmount(Math.round(parseFloat(shares) * parseFloat(price)).toString());
    } else if (useTotal && totalAmount && shares) {
      setPrice((parseFloat(totalAmount) / parseFloat(shares)).toFixed(2));
    }
    setUseTotal(!useTotal);
  };

  const handlePriceChange = (value) => {
    setPrice(value);
    if (shares && value) {
      setTotalAmount((parseFloat(shares) * parseFloat(value)).toFixed(0));
    }
  };

  const handleTotalChange = (value) => {
    setTotalAmount(value);
    if (shares && value) {
      setPrice((parseFloat(value) / parseFloat(shares)).toFixed(0));
    }
  };

  const formatTotalInput = (value) => {
    if (!value) return '';
    const digitsOnly = String(value).replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleTotalInputChange = (value) => {
    const numericValue = value.replace(/\./g, '');
    setTotalAmount(numericValue);
    if (shares && numericValue) {
      setPrice((parseFloat(numericValue) / parseFloat(shares)).toFixed(2));
    }
  };

  const applyTargetSellValue = () => {
    if (isBuy || !targetSellValue || !price) return;

    const targetValue = parseFloat(parseMK(String(targetSellValue).replace(/,/g, '')));
    const priceNum = parseFloat(price);
    if (!Number.isFinite(targetValue) || targetValue <= 0 || !Number.isFinite(priceNum) || priceNum <= 0) return;

    const targetShares = Math.floor(targetValue / priceNum);
    const cappedShares = Math.min(stock.shares, Math.max(1, targetShares));
    setShares(cappedShares.toString());
    setTotalAmount((cappedShares * priceNum).toFixed(0));
  };

  const stepShares = (delta) => {
    const current = parseFloat(parseMK(shares)) || 0;
    let newVal = Math.max(0, current + delta);
    if (!isBuy) newVal = Math.min(stock.shares, newVal);
    setShares(newVal.toString());
    if (price) setTotalAmount((newVal * parseFloat(price)).toFixed(0));
  };

  const stepPrice = (delta) => {
    if (useTotal) {
      const current = parseFloat(totalAmount) || 0;
      handleTotalChange(Math.max(0, current + delta).toString());
    } else {
      const current = parseFloat(price) || 0;
      handlePriceChange(Math.max(0, current + delta).toString());
    }
  };

  const handleConfirm = () => {
    const sharesNum = parseFloat(shares);
    const priceNum = useTotal
      ? parseFloat(totalAmount) / sharesNum
      : parseFloat(price);

    if (useTotal ? (!shares || !totalAmount) : (!shares || !price)) return;

    if (!isBuy) {
      if (sharesNum > stock.shares) {
        alert(`Cannot sell ${sharesNum} quantity. You only have ${stock.shares} quantity available.`);
        return;
      }
      if (sharesNum <= 0) {
        alert('Please enter a valid quantity to sell.');
        return;
      }
      onConfirm({ shares: sharesNum, price: priceNum });
    } else {
      onConfirm({ shares: sharesNum, price: priceNum, startTimer });
    }
  };

  const calculatedTotal = !useTotal && shares && price
    ? (parseFloat(shares) * parseFloat(price)).toFixed(2)
    : null;
  const parsedShares = parseFloat(shares);
  const parsedPrice = parseFloat(price);
  const hasTradeQuantity = Number.isFinite(parsedShares) && parsedShares > 0;
  const hasTradePrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const hasSellEstimate = !isBuy && hasTradeQuantity && hasTradePrice;
  const afterQuantity = hasTradeQuantity
    ? (isBuy ? stock.shares + parsedShares : stock.shares - parsedShares)
    : stock.shares;
  const currentQuantityExact = Number(stock.shares || 0).toLocaleString();
  const afterQuantityExact = Number(afterQuantity || 0).toLocaleString();

  // Sell-only profit calculator values
  const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
  const expectedProfit = hasSellEstimate ? (parsedPrice - avgBuy) * parsedShares : 0;
  const profitPercent = hasSellEstimate && avgBuy > 0 ? ((parsedPrice - avgBuy) / avgBuy * 100) : 0;
  const sellOverviewClass = !hasSellEstimate ? 'neutral' : (expectedProfit >= 0 ? 'positive' : 'negative');
  const totalResultLabel = useTotal ? 'Avg:' : 'Total:';
  const totalResultValue = useTotal
    ? (hasTradePrice ? `$${price}` : '-')
    : (hasTradeQuantity && hasTradePrice && calculatedTotal
      ? `$${formatNumber(parseFloat(calculatedTotal), 'full')}`
      : '-');

  const sellDisabled = !isBuy && (
    isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0
  );
  const confirmDisabled = isBuy ? isSubmitting : sellDisabled;

  return (
    <div className={`trade-modal ${isBuy ? 'buy' : 'sell'}`}>
      <div className="trade-modal-header">
        <div className="trade-modal-heading">
          <h2 className="trade-modal-title">
            {isBuy ? 'Buy' : 'Sell'} {stock.name}
          </h2>
        </div>
        <button type="button" className="trade-modal-close" onClick={onCancel} aria-label="Close modal">
          <X size={18} />
        </button>
      </div>

      <div className="trade-modal-summary-grid">
        <div
          className="trade-modal-summary-card"
          data-tooltip={`Exact quantity: ${currentQuantityExact}`}
          aria-label={`${isBuy ? 'Current' : 'Available'} exact quantity ${currentQuantityExact}`}
        >
          <span className="trade-modal-summary-label">{isBuy ? 'Current' : 'Available'}</span>
          <strong className="trade-modal-summary-value">{formatNumber(stock.shares)}</strong>
          <span className="trade-modal-summary-meta">quantity</span>
        </div>
        <div
          className="trade-modal-summary-card accent"
          data-tooltip={`Exact quantity: ${afterQuantityExact}`}
          aria-label={`After exact quantity ${afterQuantityExact}`}
        >
          <span className="trade-modal-summary-label">After</span>
          <strong className="trade-modal-summary-value">{formatNumber(afterQuantity)}</strong>
          <span className="trade-modal-summary-meta">quantity</span>
        </div>
      </div>

      {!isBuy && (
        <div className={`trade-modal-profit ${sellOverviewClass}`}>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Avg buy</span>
            <span className="trade-modal-profit-value">${avgBuy.toFixed(2)}</span>
          </div>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Sell price</span>
            <span className="trade-modal-profit-value">{hasTradePrice ? `$${parsedPrice.toFixed(2)}` : '-'}</span>
          </div>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Revenue</span>
            <span className="trade-modal-profit-value">
              {hasSellEstimate ? `$${formatNumber(calculatedTotal)}` : '-'}
            </span>
          </div>
          <div className="trade-modal-profit-divider">
            <div className="trade-modal-profit-row">
              <span className="trade-modal-profit-total-label">Expected profit</span>
              <span className={`trade-modal-profit-total-value ${sellOverviewClass}`}>
                {hasSellEstimate ? `${expectedProfit >= 0 ? '+' : ''}${formatNumber(expectedProfit)}` : '-'}
              </span>
            </div>
            <div className="trade-modal-profit-percent">
              {hasSellEstimate ? `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%` : '-'}
            </div>
          </div>
        </div>
      )}

      <div className="trade-modal-body trade-modal-body-grid">
        <section className="trade-modal-field-card">
          {isBuy ? (
            <>
              <label className="trade-modal-field-label">Quantity</label>
              <div className="trade-modal-multipliers">
                {[1, 2, 3, 4, 5].map(mult => (
                  <button
                    key={mult}
                    onClick={() => handleMultiplierChange(mult)}
                    className={`trade-modal-multiplier ${multiplier === mult ? 'active' : ''}`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="trade-modal-field-header">
              <label className="trade-modal-field-label">
                Quantity (Max: {stock.shares?.toLocaleString()})
              </label>
              <button
                onClick={() => setShares(stock.shares.toString())}
                className="trade-modal-all-btn"
              >
                ALL
              </button>
            </div>
          )}
          <div className="input-step-wrapper">
            <input
              className="input-step-field trade-modal-input"
              type="text"
              value={shares}
              onChange={(e) => handleMKInput(e.target.value, setShares)}
              placeholder="Quantity (e.g. 10k)"
              onBlur={handleSharesBlur}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepShares(1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); stepShares(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepShares(1)} aria-label="Increase quantity">
                <ArrowUp size={14} />
              </button>
              <button type="button" className="input-step-btn" onClick={() => stepShares(-1)} aria-label="Decrease quantity">
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
          {!isBuy && (
            <div className="trade-modal-worth-row">
              <label className="trade-modal-worth-label" htmlFor="target-sell-value">
                Sell worth
              </label>
              <input
                id="target-sell-value"
                className="trade-modal-worth-input"
                type="text"
                value={targetSellValue}
                onChange={(e) => setTargetSellValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyTargetSellValue();
                  }
                }}
                placeholder="20m"
              />
              <button
                type="button"
                className="trade-modal-worth-btn"
                onClick={applyTargetSellValue}
                disabled={!price}
                title={price ? 'Set quantity from target value' : 'Enter price per item first'}
              >
                Set Qty
              </button>
            </div>
          )}
        </section>

        <section className="trade-modal-field-card">
          <div className="trade-modal-field-header">
            <label className="trade-modal-field-label">
              {useTotal ? (isBuy ? 'Total Cost' : 'Total Revenue') : 'Price'}
            </label>
            {!useTotal && (geLow || geHigh) && (
              <div className="trade-modal-ge-buttons">
                {geLow && (
                  <button
                    onClick={() => handlePriceChange(geLow.toString())}
                    className="trade-modal-ge-btn low"
                  >
                    Low {formatNumber(geLow)}
                  </button>
                )}
                {geHigh && (
                  <button
                    onClick={() => handlePriceChange(geHigh.toString())}
                    className="trade-modal-ge-btn high"
                  >
                    High {formatNumber(geHigh)}
                  </button>
                )}
              </div>
            )}
            <button onClick={handleModeToggle} className="trade-modal-toggle">
              <Repeat2 size={14} />
              <span>{useTotal ? 'Price' : 'Total'}</span>
            </button>
          </div>
          <div className="input-step-wrapper">
            <input
              className="input-step-field trade-modal-input"
              type="text"
              value={useTotal ? formatTotalInput(totalAmount) : price}
              onChange={(e) => {
                const val = e.target.value;
                if (useTotal) {
                  const lower = val.toLowerCase();
                  if (lower.endsWith('k') || lower.endsWith('m')) {
                    const parsed = parseMK(val.replace(/\./g, ''));
                    if (parsed !== val) {
                      setTotalAmount(parsed);
                      if (shares && parsed) {
                        setPrice((parseFloat(parsed) / parseFloat(shares)).toFixed(2));
                      }
                      return;
                    }
                  }
                  handleTotalInputChange(val);
                } else {
                  const parsed = handleMKInput(val, setPrice);
                  if (shares && parsed) {
                    setTotalAmount((parseFloat(shares) * parseFloat(parsed)).toFixed(0));
                  }
                }
              }}
              placeholder={useTotal
                ? (isBuy ? 'Total cost (e.g. 10m)' : 'Total revenue (e.g. 10m)')
                : 'Price per item (e.g. 1.5k)'}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepPrice(1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); stepPrice(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepPrice(1)} aria-label="Increase price">
                <ArrowUp size={14} />
              </button>
              <button type="button" className="input-step-btn" onClick={() => stepPrice(-1)} aria-label="Decrease price">
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
          <div className="trade-modal-result">
            <span className="trade-modal-result-label">{totalResultLabel}</span>
            <span className="trade-modal-result-value">{totalResultValue}</span>
          </div>
        </section>

        {isBuy && (
          <label className="trade-modal-checkbox-row">
            <input
              type="checkbox"
              checked={startTimer}
              onChange={(e) => setStartTimer(e.target.checked)}
              className="trade-modal-checkbox"
            />
            <span className="trade-modal-checkbox-label">Start timer after purchase</span>
          </label>
        )}

        <div className="trade-modal-actions">
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`trade-modal-confirm ${isBuy ? 'buy' : 'sell'}`}
          >
            <Check size={16} />
            <span>Confirm</span>
          </button>
          <button onClick={onCancel} className="trade-modal-cancel">
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
