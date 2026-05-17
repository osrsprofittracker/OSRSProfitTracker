import React, { useEffect, useState } from 'react';
import { calculateAvgBuyPrice, calculateAvgSellPrice } from '../../utils/calculations';
import { formatNumber, handleMKInput, parseMK } from '../../utils/formatters';
import { nonGEItemDisplayName } from '../../utils/nonGeCatalog';
import '../../styles/trade-modal.css';

export default function NonGETradeModal({ stock, mode, onConfirm, onCancel, isSubmitting = false }) {
  const isBuy = mode === 'buy';
  const stockName = nonGEItemDisplayName(stock);
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [useTotal, setUseTotal] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    const avg = isBuy ? calculateAvgBuyPrice(stock) : calculateAvgSellPrice(stock);
    const initialPrice = avg > 0 ? Math.round(avg).toString() : '';
    setPrice(initialPrice);
    setTotalAmount('');
    setShares('');
    setUseTotal(false);
  }, [isBuy, stock]);

  const handleSharesBlur = () => {
    const parsed = parseMK(shares);
    setShares(parsed);
    if (price && parsed) {
      setTotalAmount((parseFloat(parsed) * parseFloat(price)).toFixed(0));
    }
  };

  const handlePriceChange = (value) => {
    const parsed = handleMKInput(value, setPrice);
    if (shares && parsed) {
      setTotalAmount((parseFloat(shares) * parseFloat(parsed)).toFixed(0));
    }
  };

  const handleTotalChange = (value) => {
    const numericValue = value.replace(/\./g, '');
    const parsed = handleMKInput(numericValue, setTotalAmount);
    if (shares && parsed) {
      setPrice((parseFloat(parsed) / parseFloat(shares)).toFixed(2));
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

  const stepShares = (delta) => {
    const current = parseFloat(parseMK(shares)) || 0;
    const nextValue = isBuy
      ? Math.max(0, current + delta)
      : Math.max(0, Math.min(stock.shares, current + delta));

    setShares(nextValue.toString());
    if (price) setTotalAmount((nextValue * parseFloat(price)).toFixed(0));
  };

  const stepPrice = (delta) => {
    if (useTotal) {
      const current = parseFloat(totalAmount) || 0;
      handleTotalChange(Math.max(0, current + delta).toString());
      return;
    }

    const current = parseFloat(price) || 0;
    handlePriceChange(Math.max(0, current + delta).toString());
  };

  const handleConfirm = () => {
    const sharesNum = parseFloat(shares);
    const priceNum = useTotal
      ? parseFloat(totalAmount) / sharesNum
      : parseFloat(price);

    if (useTotal ? (!shares || !totalAmount) : (!shares || !price)) return;

    if (sharesNum <= 0 || priceNum <= 0 || !Number.isFinite(priceNum)) {
      alert(`Please enter a valid quantity and ${useTotal ? 'total' : 'price'}.`);
      return;
    }

    if (!isBuy && sharesNum > stock.shares) {
      alert(`Cannot sell ${formatNumber(sharesNum)} quantity. You only have ${formatNumber(stock.shares)} quantity available.`);
      return;
    }

    onConfirm({ shares: sharesNum, price: priceNum });
  };

  const calculatedTotal = !useTotal && shares && price
    ? parseFloat(shares) * parseFloat(price)
    : null;
  const avgBuy = calculateAvgBuyPrice(stock);
  const expectedProfit = !isBuy && shares && price
    ? (parseFloat(price) - avgBuy) * parseFloat(shares)
    : 0;
  const confirmDisabled = isSubmitting || !shares || (useTotal ? !totalAmount : !price) || (!isBuy && parseFloat(shares) > stock.shares);

  return (
    <div className={`trade-modal ${isBuy ? 'buy' : 'sell'}`}>
      <h2 className="trade-modal-title">{isBuy ? 'Buy' : 'Sell'} {stockName}</h2>

      <div className={`trade-modal-banner ${isBuy ? 'buy' : 'sell'}`}>
        <div className="trade-modal-banner-row">
          <span className="trade-modal-banner-label">
            {isBuy ? 'Current' : 'Available'}: {formatNumber(stock.shares)} quantity
          </span>
          {shares && parseFloat(shares) > 0 && (
            <span className="trade-modal-banner-after">
              After: {formatNumber(isBuy ? stock.shares + parseFloat(shares) : stock.shares - parseFloat(shares))} quantity
            </span>
          )}
        </div>
      </div>

      {!isBuy && shares && price && parseFloat(shares) > 0 && parseFloat(price) > 0 && (
        <div className={`trade-modal-profit ${expectedProfit >= 0 ? 'positive' : 'negative'}`}>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Avg Buy Price:</span>
            <span className="trade-modal-profit-value">{formatNumber(avgBuy, 'full')}</span>
          </div>
          <div className="trade-modal-profit-row">
            <span className="trade-modal-profit-label">Sell Price:</span>
            <span className="trade-modal-profit-value">{formatNumber(price, 'full')}</span>
          </div>
          <div className="trade-modal-profit-divider">
            <div className="trade-modal-profit-row">
              <span className="trade-modal-profit-total-label">Expected Profit:</span>
              <span className={`trade-modal-profit-total-value ${expectedProfit >= 0 ? 'positive' : 'negative'}`}>
                {expectedProfit >= 0 ? '+' : ''}{formatNumber(expectedProfit, 'full')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="trade-modal-body">
        <div>
          <div className="trade-modal-field-header">
            <label className="trade-modal-field-label">
              Quantity{!isBuy ? ` (Max: ${formatNumber(stock.shares, 'full')})` : ''}
            </label>
            {!isBuy && (
              <button type="button" onClick={() => setShares(stock.shares.toString())} className="trade-modal-all-btn">
                ALL
              </button>
            )}
          </div>
          <div className="input-step-wrapper">
            <input
              className="input-step-field trade-modal-input"
              type="text"
              value={shares}
              onChange={(event) => handleMKInput(event.target.value, setShares)}
              placeholder="Quantity (e.g. 10k)"
              onBlur={handleSharesBlur}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') { event.preventDefault(); stepShares(1); }
                if (event.key === 'ArrowDown') { event.preventDefault(); stepShares(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepShares(1)}>&#9650;</button>
              <button type="button" className="input-step-btn" onClick={() => stepShares(-1)}>&#9660;</button>
            </div>
          </div>
        </div>

        <div>
          <div className="trade-modal-field-header">
            <label className="trade-modal-field-label">
              {useTotal ? (isBuy ? 'Total Cost' : 'Total Revenue') : 'Price per Item'}
            </label>
            <button type="button" onClick={handleModeToggle} className="trade-modal-toggle">
              &#8644; {useTotal ? 'Price' : 'Total'}
            </button>
          </div>
          <div className="input-step-wrapper">
            <input
              className="input-step-field trade-modal-input"
              type="text"
              value={useTotal ? totalAmount : price}
              onChange={(event) => {
                if (useTotal) {
                  handleTotalChange(event.target.value);
                } else {
                  handlePriceChange(event.target.value);
                }
              }}
              placeholder={useTotal ? 'Total GP (e.g. 10m)' : 'Price per item (e.g. 1.5k)'}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') { event.preventDefault(); stepPrice(1); }
                if (event.key === 'ArrowDown') { event.preventDefault(); stepPrice(-1); }
              }}
            />
            <div className="input-step-btns">
              <button type="button" className="input-step-btn" onClick={() => stepPrice(1)}>&#9650;</button>
              <button type="button" className="input-step-btn" onClick={() => stepPrice(-1)}>&#9660;</button>
            </div>
          </div>
          {useTotal && price && (
            <div className="trade-modal-result">
              <span className="trade-modal-result-label">Avg: </span>
              <span className="trade-modal-result-value">{formatNumber(price, 'full')}</span>
            </div>
          )}
          {!useTotal && calculatedTotal && (
            <div className="trade-modal-result">
              <span className="trade-modal-result-label">Total: </span>
              <span className="trade-modal-result-value">{formatNumber(calculatedTotal, 'full')}</span>
            </div>
          )}
        </div>

        <div className="trade-modal-actions">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`trade-modal-confirm ${isBuy ? 'buy' : 'sell'}`}
          >
            Confirm
          </button>
          <button type="button" onClick={onCancel} className="trade-modal-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
