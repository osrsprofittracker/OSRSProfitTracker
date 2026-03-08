import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { useTimeseries } from '../hooks/useTimeseries';
import { calculateGETax } from '../utils/taxUtils';

const TIMEFRAMES = [
  { label: '1D', timestep: '5m', filterDays: 1 },
  { label: '1W', timestep: '1h', filterDays: 7 },
  { label: '1M', timestep: '6h', filterDays: 30 },
  { label: '3M', timestep: '24h', filterDays: 90 },
  { label: '6M', timestep: '24h', filterDays: 180 },
  { label: '1Y', timestep: '24h', filterDays: 365 },
];

export default function GraphsPage({ mapping, prices, iconMap, mappingLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const highSeriesRef = useRef(null);
  const lowSeriesRef = useRef(null);

  const tf = TIMEFRAMES.find(t => t.label === timeframe);
  const { data: rawData, loading, error } = useTimeseries(
    selectedItem?.id || null,
    tf?.timestep || '5m'
  );

  const chartData = useMemo(() => {
    if (!rawData.length) return [];
    const cutoff = Date.now() / 1000 - (tf?.filterDays || 365) * 86400;
    return rawData
      .filter(d => d.timestamp >= cutoff && (d.avgHighPrice != null || d.avgLowPrice != null))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [rawData, tf]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mapping.filter(item => item.name.toLowerCase().includes(q)).slice(0, 50);
  }, [searchQuery, mapping]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const priceFormat = { type: 'custom', formatter: (p) => Math.round(p).toLocaleString() };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'rgb(15, 23, 42)' },
        textColor: 'rgb(148, 163, 184)',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.5)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.5)' },
      },
      crosshair: { mode: 0 },
      handleScroll: false,
      handleScale: false,
      timeScale: {
        timeVisible: true,
        borderColor: 'rgb(51, 65, 85)',
      },
      rightPriceScale: {
        borderColor: 'rgb(51, 65, 85)',
      },
      leftPriceScale: {
        visible: true,
        borderColor: 'rgb(51, 65, 85)',
      },
    });

    const highSeries = chart.addSeries(LineSeries, {
      color: 'rgb(96, 165, 250)',
      lineWidth: 2,
      title: '',
      priceFormat,
      priceScaleId: 'right',
    });

    const lowSeries = chart.addSeries(LineSeries, {
      color: 'rgb(52, 211, 153)',
      lineWidth: 2,
      title: '',
      priceFormat,
      priceScaleId: 'left',
    });

    chartRef.current = chart;
    highSeriesRef.current = highSeries;
    lowSeriesRef.current = lowSeries;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(chartContainerRef.current);

    // Crosshair tooltip
    const toolEl = document.createElement('div');
    toolEl.className = 'graphs-crosshair-tooltip';
    chartContainerRef.current.appendChild(toolEl);

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        toolEl.style.display = 'none';
        return;
      }
      const highVal = param.seriesData.get(highSeries);
      const lowVal = param.seriesData.get(lowSeries);
      if (!highVal && !lowVal) {
        toolEl.style.display = 'none';
        return;
      }
      const highStr = highVal?.value != null ? Math.round(highVal.value).toLocaleString() : '—';
      const lowStr = lowVal?.value != null ? Math.round(lowVal.value).toLocaleString() : '—';
      toolEl.innerHTML = `<span style="color:rgb(96,165,250)">High: ${highStr}</span><br/><span style="color:rgb(52,211,153)">Low: ${lowStr}</span>`;
      toolEl.style.display = 'block';
      const containerWidth = chartContainerRef.current.clientWidth;
      const tooltipWidth = 180;
      let left = param.point.x + 12;
      if (left + tooltipWidth > containerWidth) left = param.point.x - tooltipWidth - 12;
      toolEl.style.left = left + 'px';
      toolEl.style.top = param.point.y + 'px';
    });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      if (toolEl.parentNode) toolEl.parentNode.removeChild(toolEl);
    };
  }, []);

  // Update chart data and time axis format based on timeframe
  useEffect(() => {
    if (!highSeriesRef.current || !lowSeriesRef.current) return;

    const highData = chartData
      .filter(d => d.avgHighPrice != null)
      .map(d => ({ time: d.timestamp, value: d.avgHighPrice }));
    const lowData = chartData
      .filter(d => d.avgLowPrice != null)
      .map(d => ({ time: d.timestamp, value: d.avgLowPrice }));

    highSeriesRef.current.setData(highData);
    lowSeriesRef.current.setData(lowData);

    if (chartRef.current) {
      // For 3M+ show dates only, for shorter show time too
      const showTime = ['1D', '1W', '1M'].includes(timeframe);
      chartRef.current.applyOptions({
        timeScale: { timeVisible: showTime },
      });
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData, timeframe]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    if (!e.target.value.trim()) {
      setSelectedItem(null);
    }
  };

  const currentPrice = selectedItem && prices?.[selectedItem.id];

  const priceChange = useMemo(() => {
    if (!chartData.length || !currentPrice?.high) return null;
    const first = chartData.find(d => d.avgHighPrice != null);
    if (!first || !first.avgHighPrice) return null;
    const change = currentPrice.high - first.avgHighPrice;
    const pct = (change / first.avgHighPrice) * 100;
    return { change, pct };
  }, [chartData, currentPrice]);

  const itemStats = useMemo(() => {
    if (!selectedItem || !currentPrice) return null;
    const high = currentPrice.high;
    const low = currentPrice.low;
    const margin = high != null && low != null ? high - low : null;
    const tax = high != null ? calculateGETax(selectedItem.id, high) : 0;
    const profitPerMargin = margin != null ? margin - tax : null;
    const dailyVolume = chartData.reduce((sum, d) => sum + (d.highPriceVolume || 0) + (d.lowPriceVolume || 0), 0);
    return {
      margin,
      profitPerMargin,
      volume: dailyVolume,
      highAlch: selectedItem.highalch,
      members: selectedItem.members,
    };
  }, [selectedItem, currentPrice, chartData]);

  const formatPrice = (val) => {
    if (val == null) return '—';
    return val.toLocaleString();
  };

  return (
    <div className="graphs-page">
      <div className="graphs-header">
        <h2 className="graphs-title">Price Charts</h2>
        <p className="graphs-subtitle">Search for any item to view price history</p>
      </div>

      <div className="graphs-search-container" style={{ position: 'relative' }}>
        <input
          ref={searchRef}
          type="text"
          className="graphs-search-input"
          placeholder={mappingLoading ? 'Loading items...' : 'Search for an item...'}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => { if (searchQuery) setShowDropdown(true); }}
          disabled={mappingLoading}
        />
        {showDropdown && filteredItems.length > 0 && (
          <div className="graphs-dropdown" ref={dropdownRef}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="graphs-dropdown-item"
                onClick={() => handleSelectItem(item)}
              >
                {iconMap[item.id] && (
                  <img
                    src={iconMap[item.id]}
                    alt=""
                    style={{ width: 24, height: 24, marginRight: 8, imageRendering: 'pixelated' }}
                  />
                )}
                <span>{item.name}</span>
                {item.limit && (
                  <span className="graphs-dropdown-limit">Limit: {item.limit.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="graphs-info-panel">
          <div className="graphs-info-header">
            {iconMap[selectedItem.id] && (
              <img
                src={iconMap[selectedItem.id]}
                alt=""
                style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
              />
            )}
            <h3 className="graphs-info-name">{selectedItem.name}</h3>
            {itemStats && (
              <span className={`graphs-info-badge ${itemStats.members ? 'graphs-info-badge--p2p' : 'graphs-info-badge--f2p'}`}>
                {itemStats.members ? 'P2P' : 'F2P'}
              </span>
            )}
          </div>
          <div className="graphs-info-stats">
            {currentPrice && (
              <>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">High</span>
                  <span className="graphs-info-value graphs-info-value--high">{formatPrice(currentPrice.high)}</span>
                </div>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">Low</span>
                  <span className="graphs-info-value graphs-info-value--low">{formatPrice(currentPrice.low)}</span>
                </div>
              </>
            )}
            {itemStats?.margin != null && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Margin</span>
                <span className="graphs-info-value">{itemStats.margin.toLocaleString()}</span>
              </div>
            )}
            {itemStats?.profitPerMargin != null && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Profit/Margin</span>
                <span className={`graphs-info-value ${itemStats.profitPerMargin >= 0 ? 'graphs-info-value--high' : 'graphs-info-value--negative'}`}>
                  {itemStats.profitPerMargin.toLocaleString()}
                </span>
              </div>
            )}
            {selectedItem.limit && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Buy Limit</span>
                <span className="graphs-info-value">{selectedItem.limit.toLocaleString()}</span>
              </div>
            )}
            {itemStats?.volume > 0 && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Volume ({timeframe})</span>
                <span className="graphs-info-value">{itemStats.volume.toLocaleString()}</span>
              </div>
            )}
            {itemStats?.highAlch != null && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">High Alch</span>
                <span className="graphs-info-value">{itemStats.highAlch.toLocaleString()}</span>
              </div>
            )}
            {priceChange && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Change ({timeframe})</span>
                <span className={`graphs-info-value ${priceChange.change >= 0 ? 'graphs-info-value--high' : 'graphs-info-value--negative'}`}>
                  {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toLocaleString()} ({priceChange.pct >= 0 ? '+' : ''}{priceChange.pct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="graphs-timeframe-bar">
          {TIMEFRAMES.map(t => (
            <button
              key={t.label}
              className={`graphs-timeframe-btn${timeframe === t.label ? ' graphs-timeframe-btn--active' : ''}`}
              onClick={() => setTimeframe(t.label)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="graphs-chart-container" ref={chartContainerRef}>
        {!selectedItem && (
          <div className="graphs-empty-state">
            Search for an item above to view its price chart
          </div>
        )}
        {loading && (
          <div className="graphs-empty-state">
            Loading chart data...
          </div>
        )}
        {error && (
          <div className="graphs-empty-state">
            Failed to load data: {error}
          </div>
        )}
      </div>
    </div>
  );
}
