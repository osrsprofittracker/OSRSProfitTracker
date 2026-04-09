import React, { useState, useEffect } from 'react';
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
        alert(`Cannot sell ${sharesNum} shares. You only have ${stock.shares} shares available.`);
        return;
      }
      if (sharesNum <= 0) {
        alert('Please enter a valid number of shares to sell.');
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

  // Sell-only profit calculator values
  const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
  const expectedProfit = !isBuy && shares && price ? (parseFloat(price) - avgBuy) * parseFloat(shares) : 0;
  const profitPercent = !isBuy && avgBuy > 0 && price ? ((parseFloat(price) - avgBuy) / avgBuy * 100) : 0;

  const sellDisabled = !isBuy && (
    isSubmitting || !shares || parseFloat(shares) > stock.shares || parseFloat(shares) <= 0
  );
  const confirmDisabled = isBuy ? isSubmitting : sellDisabled;

  return (
    <div className={`trade-modal ${isBuy ? 'buy' : 'sell'}`}>
      <h2 className="trade-modal-title">
        {isBuy ? 'Buy' : 'Sell'} {stock.name}
      </h2>

      <div className={`trade-modal-banner ${isBuy ? 'buy' : 'sell'}`}>
        <div className="trade-modal-banner-row">
          <span className="trade-modal-banner-label">
            {isBuy ? 'Current' : 'Available'}: {formatNumber(stock.shares)} shares
          </span>
          {shares && parseFloat(shares) > 0 && (
            <span className="trade-modal-banner-after">
              After: {formatNumber(isBuy ? stock.shares + parseFloat(shares) : stock.shares - parseFloat(shares))} shares
            </span>
          )}
        </div>
      </div>

      {!isBuy && shares && price && parseFloat(shares) > 0 && parseFloat(price) > 0 && (
        <div className={`trade-modal-profit ${expectedProfit >= 0 ? 'positive' : 'negative'}`}>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Avg Buy Price:</span>
            <span className="trade-modal-profit-value">${avgBuy.toFixed(2)}</span>
          </div>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Sell Price:</span>
            <span className="trade-modal-profit-value">${parseFloat(price).toFixed(2)}</span>
          </div>
          {!useTotal && calculatedTotal && (
            <div className="trade-modal-profit-row">
              <span className="trade-modal-profit-label">Total Revenue:</span>
              <span className="trade-modal-profit-value">${formatNumber(calculatedTotal)}</span>
            </div>
          )}
          <div className="trade-modal-profit-divider">
            <div className="trade-modal-profit-row">
              <span className="trade-modal-profit-total-label">Expected Profit:</span>
              <span className={`trade-modal-profit-total-value ${expectedProfit >= 0 ? 'positive' : 'negative'}`}>
                {(expectedProfit >= 0 ? '+' : '') + formatNumber(expectedProfit)}
              </span>
            </div>
            <div className="trade-modal-profit-percent">
              {(profitPercent >= 0 ? '+' : '') + profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div className="trade-modal-body">
        <div>
          {isBuy ? (
            <>
              <label className="trade-modal-field-label">Shares</label>
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
                Shares (Max: {stock.shares?.toLocaleString()})
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
              placeholder="Number of shares (e.g. 10k)"
              onBlur={handleSharesBlur}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepShares(1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); stepShares(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepShares(1)}>▲</button>
              <button type="button" className="input-step-btn" onClick={() => stepShares(-1)}>▼</button>
            </div>
          </div>
        </div>

        <div>
          <div className="trade-modal-field-header">
            <label className="trade-modal-field-label">
              {useTotal ? (isBuy ? 'Total Cost' : 'Total Revenue') : 'Price per Share'}
            </label>
            {!useTotal && (geLow || geHigh) && (
              <div className="trade-modal-ge-buttons">
                {geLow && (
                  <button
                    onClick={() => handlePriceChange(geLow.toString())}
                    className="trade-modal-ge-btn low"
                  >
                    Low: {formatNumber(geLow)}
                  </button>
                )}
                {geHigh && (
                  <button
                    onClick={() => handlePriceChange(geHigh.toString())}
                    className="trade-modal-ge-btn high"
                  >
                    High: {formatNumber(geHigh)}
                  </button>
                )}
              </div>
            )}
            <button onClick={handleModeToggle} className="trade-modal-toggle">
              ⇄ {useTotal ? 'Price' : 'Total'}
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
                : 'Price per share (e.g. 1.5k)'}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); stepPrice(1); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); stepPrice(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepPrice(1)}>▲</button>
              <button type="button" className="input-step-btn" onClick={() => stepPrice(-1)}>▼</button>
            </div>
          </div>
          {useTotal && price && (
            <div className="trade-modal-result">
              <span className="trade-modal-result-label">Avg: </span>
              <span className="trade-modal-result-value">${price}</span>
            </div>
          )}
          {!useTotal && calculatedTotal && (
            <div className="trade-modal-result">
              <span className="trade-modal-result-label">Total: </span>
              <span className="trade-modal-result-value">
                ${formatNumber(parseFloat(calculatedTotal), 'full')}
              </span>
            </div>
          )}
        </div>

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
            Confirm
          </button>
          <button onClick={onCancel} className="trade-modal-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
