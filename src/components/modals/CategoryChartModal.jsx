import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatters';

export default function CategoryChartModal({ groupedStocks, onCancel, numberFormat }) {
  const [mode, setMode] = useState('totalCost'); // 'totalCost', 'shares', 'profit', 'soldCost', 'soldShares'

  const categoryData = Object.entries(groupedStocks).map(([cat, stocks]) => {
    let value = 0;
    switch (mode) {
      case 'totalCost':
        value = stocks.reduce((sum, s) => sum + s.totalCost, 0);
        break;
      case 'shares':
        value = stocks.reduce((sum, s) => sum + s.shares, 0);
        break;
      case 'profit':
        value = stocks.reduce((sum, s) => sum + (s.totalCostSold - (s.totalCostBasisSold || 0)), 0);
        break;
      case 'soldCost':
        value = stocks.reduce((sum, s) => sum + s.totalCostSold, 0);
        break;
      case 'soldShares':
        value = stocks.reduce((sum, s) => sum + s.sharesSold, 0);
        break;
    }
    return { category: cat, value };
  }).filter(d => d.value > 0);

  const total = categoryData.reduce((sum, d) => sum + d.value, 0);
  const colors = [
    'rgb(96, 165, 250)', 
    'rgb(52, 211, 153)', 
    'rgb(168, 85, 247)', 
    'rgb(251, 146, 60)', 
    'rgb(234, 179, 8)', 
    'rgb(239, 68, 68)'
  ];

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

  const modes = [
    { key: 'totalCost', label: 'Total Cost', color: 'rgb(96, 165, 250)' },
    { key: 'shares', label: 'Shares', color: 'rgb(251, 146, 60)' },
    { key: 'profit', label: 'Profit', color: 'rgb(52, 211, 153)' },
    { key: 'soldCost', label: 'Sold Cost', color: 'rgb(192, 132, 252)' },
    { key: 'soldShares', label: 'Sold Shares', color: 'rgb(168, 85, 247)' }
  ];

  return (
    <div style={{
      background: 'rgb(30, 41, 59)',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      width: '24rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgb(51, 65, 85)'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
        Category Comparison
      </h2>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              flex: 1,
              minWidth: '80px',
              padding: '0.5rem',
              background: mode === m.key ? m.color : 'rgb(71, 85, 105)',
              borderRadius: '0.5rem',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => {
              if (mode !== m.key) e.currentTarget.style.background = 'rgb(51, 65, 85)';
            }}
            onMouseOut={(e) => {
              if (mode !== m.key) e.currentTarget.style.background = 'rgb(71, 85, 105)';
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* Pie Chart */}
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          {categoryData.map((data, index) => {
            const percent = data.value / total;
            const slice = createSlice(currentPercent, percent);
            const sliceElement = (
              <path
                key={index}
                d={slice}
                fill={colors[index % colors.length]}
                stroke="rgb(30, 41, 59)"
                strokeWidth="2"
              />
            );
            currentPercent += percent;
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
            {formatNumber(total, numberFormat)}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
          {categoryData.map((data, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'rgb(51, 65, 85)',
                borderRadius: '0.5rem',
                borderLeft: `4px solid ${colors[index % colors.length]}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: colors[index % colors.length],
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)', fontWeight: '500' }}>
                  {data.category}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                  {formatNumber(data.value, numberFormat)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                  {((data.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {categoryData.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgb(156, 163, 175)',
            padding: '2rem',
            fontSize: '0.875rem'
          }}>
            No data available for this metric
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