import React from 'react';
import { formatNumber } from '../../utils/formatters';
import { calculateStocksProfit } from '../../utils/calculations';

export default function ProfitChartModal({ stocks, dumpProfit, referralProfit, bondsProfit, onCancel, numberFormat }) {
  const stocksProfit = calculateStocksProfit(stocks);
  const totalProfit = stocksProfit + dumpProfit + referralProfit + bondsProfit;

  const segments = [];
  if (stocksProfit > 0) {
    segments.push({ 
      percent: stocksProfit / totalProfit, 
      color: 'rgb(96, 165, 250)', 
      label: 'Stocks', 
      value: stocksProfit 
    });
  }
  if (dumpProfit > 0) {
    segments.push({ 
      percent: dumpProfit / totalProfit, 
      color: 'rgb(52, 211, 153)', 
      label: 'Dump', 
      value: dumpProfit 
    });
  }
  if (referralProfit > 0) {
    segments.push({ 
      percent: referralProfit / totalProfit, 
      color: 'rgb(168, 85, 247)', 
      label: 'Referral', 
      value: referralProfit 
    });
  }
  if (bondsProfit > 0) {
    segments.push({ 
      percent: bondsProfit / totalProfit, 
      color: 'rgb(234, 179, 8)', 
      label: 'Bonds', 
      value: bondsProfit 
    });
  }

  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const createSlice = (startPercent, percent) => {
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(startPercent + percent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;

    return `
      M ${centerX + startX * radius} ${centerY + startY * radius}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${centerX + endX * radius} ${centerY + endY * radius}
      L ${centerX} ${centerY}
    `;
  };

  let currentPercent = 0;

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
        Profit Breakdown
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* Pie Chart */}
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((segment, index) => {
            const slice = createSlice(currentPercent, segment.percent);
            const sliceElement = (
              <path
                key={index}
                d={slice}
                fill={segment.color}
                stroke="rgb(30, 41, 59)"
                strokeWidth="2"
              />
            );
            currentPercent += segment.percent;
            return sliceElement;
          })}
          <circle cx={centerX} cy={centerY} r="40" fill="rgb(30, 41, 59)" />
        </svg>

        {/* Total in center */}
        <div style={{
          marginTop: '-140px',
          marginBottom: '60px',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>
            Total
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
            {formatNumber(totalProfit, numberFormat)}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {segments.map((segment, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                borderRadius: '0.5rem',
                borderLeft: `4px solid ${segment.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: segment.color,
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)', fontWeight: '500' }}>
                  {segment.label}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                  {formatNumber(segment.value, numberFormat)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                  {(segment.percent * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalProfit === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgb(156, 163, 175)',
            padding: '2rem',
            fontSize: '0.875rem'
          }}>
            No profit data yet. Start trading to see your breakdown!
          </div>
        )}

        {/* Close Button */}
        <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid rgb(71, 85, 105)', paddingTop: '1rem' }}>
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}