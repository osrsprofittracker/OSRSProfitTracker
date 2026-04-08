import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createChart, LineSeries, HistogramSeries, CandlestickSeries } from 'lightweight-charts';
import { Star, Clock, Search, ChevronDown, Bell, BellRing, StickyNote } from 'lucide-react';
import { useTimeseries } from '../hooks/useTimeseries';
import { useGraphPreferences } from '../hooks/useGraphPreferences';
import { calculateGETax } from '../utils/taxUtils';
import { useGEData } from '../contexts/GEDataContext';
import { useTrade } from '../contexts/TradeContext';
import ModalContainer from '../components/modals/ModalContainer';
import NotesModal from '../components/modals/NotesModal';
import '../styles/graphs-page.css';

const TIMEFRAMES = [
  { label: '1D', timestep: '5m', filterDays: 1 },
  { label: '1W', timestep: '1h', filterDays: 7 },
  { label: '1M', timestep: '6h', filterDays: 30 },
  { label: '3M', timestep: '24h', filterDays: 90 },
  { label: '6M', timestep: '24h', filterDays: 180 },
  { label: '1Y', timestep: '24h', filterDays: 365 },
];

export default function GraphsPage({ userId, initialItemId, navigateToPage, priceAlerts = {}, onPriceAlert, stockNotes = {}, onSaveNote }) {
  const { geMapping: mapping, gePrices: prices, geIconMap: iconMap, mappingLoading } = useGEData();
  const { stocks } = useTrade();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartMode, setChartMode] = useState('line');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesStock, setNotesStock] = useState(null);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const chartContainerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const chartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const highSeriesRef = useRef(null);
  const lowSeriesRef = useRef(null);
  const buyVolSeriesRef = useRef(null);
  const sellVolSeriesRef = useRef(null);
  const selectedItemRef = useRef(null);
  const chartDataRef = useRef([]);
  const candleSeriesRef = useRef(null);
  const chartModeRef = useRef('line');

  const { favorites, recents, addRecent, toggleFavorite, isFavorite, reorderFavorites } = useGraphPreferences(userId);

  const [favoritesCollapsed, setFavoritesCollapsed] = useState(
    () => localStorage.getItem(`graphsFavoritesCollapsed_${userId}`) === 'true'
  );
  const draggedFavRef = useRef(null);

  selectedItemRef.current = selectedItem;
  chartModeRef.current = chartMode;

  const tf = TIMEFRAMES.find(t => t.label === timeframe);
  const { data: rawData, loading, error } = useTimeseries(
    selectedItem?.id || null,
    tf?.timestep || '5m'
  );

  const tzOffsetSeconds = new Date().getTimezoneOffset() * -60;

  const chartData = useMemo(() => {
    if (!rawData.length) return [];
    const cutoff = Date.now() / 1000 - (tf?.filterDays || 365) * 86400;
    return rawData
      .filter(d => d.timestamp >= cutoff && (d.avgHighPrice != null || d.avgLowPrice != null))
      .map(d => ({ ...d, timestamp: d.timestamp + tzOffsetSeconds }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [rawData, tf]);

  const candlestickData = useMemo(() => {
    if (!chartData.length) return [];
    return chartData
      .filter(d => d.avgHighPrice != null && d.avgLowPrice != null)
      .map((d, i, arr) => {
        const high = d.avgHighPrice;
        const low = d.avgLowPrice;
        const close = (high + low) / 2;
        const open = i === 0 ? low
          : (arr[i - 1].avgHighPrice + arr[i - 1].avgLowPrice) / 2;
        return { time: d.timestamp, open: Math.round(open), high: Math.round(high), low: Math.round(low), close: Math.round(close) };
      });
  }, [chartData]);

  chartDataRef.current = chartData;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mapping.filter(item => item.name.toLowerCase().includes(q)).slice(0, 50);
  }, [searchQuery, mapping]);

  // Build dropdown sections
  const dropdownSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sections = [];

    // Helper to find full mapping item from a preference
    const findMappingItem = (pref) => mapping.find(m => m.id === pref.itemId);

    if (!q) {
      // Empty search: show recents then favorites
      if (recents.length > 0) {
        sections.push({
          label: 'Recent',
          icon: 'clock',
          items: recents.map(r => findMappingItem(r)).filter(Boolean),
        });
      }
      if (favorites.length > 0) {
        sections.push({
          label: 'Favorites',
          icon: 'star',
          items: favorites.map(f => findMappingItem(f)).filter(Boolean),
        });
      }
    } else {
      // Searching: show all results in one flat list (stars indicate favorites)
      if (filteredItems.length > 0) {
        sections.push({ label: 'Results', icon: 'search', items: filteredItems });
      }
    }
    return sections;
  }, [searchQuery, favorites, recents, filteredItems, mapping]);

  const hasDropdownContent = dropdownSections.some(s => s.items.length > 0);

  // Auto-select item from URL query param
  useEffect(() => {
    if (!mapping.length) return;
    if (!initialItemId) {
      setSelectedItem(null);
      setSearchQuery('');
      return;
    }
    const itemId = Number(initialItemId);
    const item = mapping.find(m => m.id === itemId);
    if (item && selectedItem?.id !== itemId) {
      setSelectedItem(item);
      setSearchQuery(item.name);
      addRecent(item);
    }
  }, [initialItemId, mapping]);

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
        minimumWidth: 60,
      },
    });

    const highSeries = chart.addSeries(LineSeries, {
      color: 'rgb(34, 197, 94)',
      lineWidth: 2,
      title: '',
      priceFormat,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const lowSeries = chart.addSeries(LineSeries, {
      color: 'rgb(239, 68, 68)',
      lineWidth: 2,
      title: '',
      priceFormat,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'rgb(34, 197, 94)',
      downColor: 'rgb(239, 68, 68)',
      borderUpColor: 'rgb(34, 197, 94)',
      borderDownColor: 'rgb(239, 68, 68)',
      wickUpColor: 'rgb(34, 197, 94)',
      wickDownColor: 'rgb(239, 68, 68)',
      priceFormat,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    highSeriesRef.current = highSeries;
    lowSeriesRef.current = lowSeries;
    candleSeriesRef.current = candleSeries;

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
      const time = param.time;
      const data = chartDataRef.current;
      let nearest = null;
      let minDiff = Infinity;
      for (let i = 0; i < data.length; i++) {
        const diff = Math.abs(data[i].timestamp - time);
        if (diff < minDiff) { minDiff = diff; nearest = data[i]; }
        if (data[i].timestamp > time) break;
      }
      if (!nearest) {
        toolEl.style.display = 'none';
        return;
      }
      const highNum = nearest.avgHighPrice != null ? Math.round(nearest.avgHighPrice) : null;
      const lowNum = nearest.avgLowPrice != null ? Math.round(nearest.avgLowPrice) : null;
      if (highNum == null && lowNum == null) {
        toolEl.style.display = 'none';
        return;
      }
      if (chartModeRef.current === 'candle' && highNum != null && lowNum != null) {
        const close = Math.round((nearest.avgHighPrice + nearest.avgLowPrice) / 2);
        const idx = data.indexOf(nearest);
        const open = idx <= 0
          ? Math.round(nearest.avgLowPrice)
          : Math.round((data[idx - 1].avgHighPrice + data[idx - 1].avgLowPrice) / 2);
        toolEl.innerHTML = `<span style="color:rgb(148,163,184)">O: ${open.toLocaleString()}</span><br/><span style="color:rgb(34,197,94)">H: ${highNum.toLocaleString()}</span><br/><span style="color:rgb(239,68,68)">L: ${lowNum.toLocaleString()}</span><br/><span style="color:rgb(148,163,184)">C: ${close.toLocaleString()}</span>`;
      } else {
        const highStr = highNum != null ? highNum.toLocaleString() : '—';
        const lowStr = lowNum != null ? lowNum.toLocaleString() : '—';
        toolEl.innerHTML = `<span style="color:rgb(34,197,94)">High: ${highStr}</span><br/><span style="color:rgb(239,68,68)">Low: ${lowStr}</span>`;
      }
      toolEl.style.display = 'block';
      const containerWidth = chartContainerRef.current.clientWidth;
      const tooltipWidth = 180;
      let left = param.point.x + 12;
      if (left + tooltipWidth > containerWidth) left = param.point.x - tooltipWidth - 12;
      toolEl.style.left = left + 'px';
      toolEl.style.top = param.point.y + 'px';
    });

    // Volume chart
    if (!volumeContainerRef.current) {
      return () => {
        ro.disconnect();
        chart.remove();
        chartRef.current = null;
        if (toolEl.parentNode) toolEl.parentNode.removeChild(toolEl);
      };
    }

    const volFormat = { type: 'custom', formatter: (v) => Math.round(Math.abs(v)).toLocaleString() };

    const volumeChart = createChart(volumeContainerRef.current, {
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
        minimumWidth: 60,
      },
    });

    const buyVolSeries = volumeChart.addSeries(HistogramSeries, {
      color: 'rgb(34, 197, 94)',
      priceFormat: volFormat,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const sellVolSeries = volumeChart.addSeries(HistogramSeries, {
      color: 'rgb(239, 68, 68)',
      priceFormat: volFormat,
      priceScaleId: 'right',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volumeChartRef.current = volumeChart;
    buyVolSeriesRef.current = buyVolSeries;
    sellVolSeriesRef.current = sellVolSeries;

    const volRo = new ResizeObserver(entries => {
      for (const entry of entries) {
        volumeChart.applyOptions({ width: entry.contentRect.width });
      }
    });
    volRo.observe(volumeContainerRef.current);

    // Volume crosshair tooltip
    const volToolEl = document.createElement('div');
    volToolEl.className = 'graphs-crosshair-tooltip';
    volumeContainerRef.current.appendChild(volToolEl);

    volumeChart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        volToolEl.style.display = 'none';
        return;
      }
      const time = param.time;
      const data = chartDataRef.current;
      let nearest = null;
      let minDiff = Infinity;
      for (let i = 0; i < data.length; i++) {
        const diff = Math.abs(data[i].timestamp - time);
        if (diff < minDiff) { minDiff = diff; nearest = data[i]; }
        if (data[i].timestamp > time) break;
      }
      if (!nearest) {
        volToolEl.style.display = 'none';
        return;
      }
      const buyVol = (nearest.highPriceVolume || 0).toLocaleString();
      const sellVol = (nearest.lowPriceVolume || 0).toLocaleString();
      volToolEl.innerHTML = `<span style="color:rgb(34,197,94)">Buy: ${buyVol}</span><br/><span style="color:rgb(239,68,68)">Sell: ${sellVol}</span>`;
      volToolEl.style.display = 'block';
      const containerWidth = volumeContainerRef.current.clientWidth;
      const tooltipWidth = 180;
      let left = param.point.x + 12;
      if (left + tooltipWidth > containerWidth) left = param.point.x - tooltipWidth - 12;
      volToolEl.style.left = left + 'px';
      volToolEl.style.top = param.point.y + 'px';
    });

    // Sync time scales between price and volume charts
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) volumeChart.timeScale().setVisibleLogicalRange(range);
    });
    volumeChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) chart.timeScale().setVisibleLogicalRange(range);
    });

    return () => {
      ro.disconnect();
      volRo.disconnect();
      chart.remove();
      volumeChart.remove();
      chartRef.current = null;
      volumeChartRef.current = null;
      candleSeriesRef.current = null;
      if (toolEl.parentNode) toolEl.parentNode.removeChild(toolEl);
      if (volToolEl.parentNode) volToolEl.parentNode.removeChild(volToolEl);
    };
  }, []);

  // Update chart data and time axis format based on timeframe
  useEffect(() => {
    if (!highSeriesRef.current || !lowSeriesRef.current || !candleSeriesRef.current) return;

    // Clear charts when no item is selected
    if (!selectedItem) {
      highSeriesRef.current.setData([]);
      lowSeriesRef.current.setData([]);
      candleSeriesRef.current.setData([]);
      if (buyVolSeriesRef.current) buyVolSeriesRef.current.setData([]);
      if (sellVolSeriesRef.current) sellVolSeriesRef.current.setData([]);
      return;
    }

    if (chartMode === 'candle') {
      highSeriesRef.current.setData([]);
      lowSeriesRef.current.setData([]);
      candleSeriesRef.current.setData(candlestickData);
    } else {
      candleSeriesRef.current.setData([]);
      const highData = chartData
        .filter(d => d.avgHighPrice != null)
        .map(d => ({ time: d.timestamp, value: d.avgHighPrice }));
      const lowData = chartData
        .filter(d => d.avgLowPrice != null)
        .map(d => ({ time: d.timestamp, value: d.avgLowPrice }));
      highSeriesRef.current.setData(highData);
      lowSeriesRef.current.setData(lowData);
    }

    // Volume data: buy (positive/green), sell (negative/red)
    if (buyVolSeriesRef.current && sellVolSeriesRef.current) {
      const buyVolData = chartData.map(d => ({
        time: d.timestamp,
        value: d.highPriceVolume || 0,
      }));
      const sellVolData = chartData.map(d => ({
        time: d.timestamp,
        value: -(d.lowPriceVolume || 0),
      }));
      buyVolSeriesRef.current.setData(buyVolData);
      sellVolSeriesRef.current.setData(sellVolData);
    }

    const showTime = ['1D', '1W', '1M'].includes(timeframe);
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: { timeVisible: showTime },
      });
      chartRef.current.timeScale().fitContent();
    }
    if (volumeChartRef.current) {
      volumeChartRef.current.applyOptions({
        timeScale: { timeVisible: showTime },
      });
      volumeChartRef.current.timeScale().fitContent();
    }
  }, [chartData, timeframe, selectedItem, chartMode, candlestickData]);

  const toggleFavoritesCollapsed = () => {
    setFavoritesCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(`graphsFavoritesCollapsed_${userId}`, String(next));
      return next;
    });
  };

  const handleFavDragStart = (e, itemId) => {
    draggedFavRef.current = itemId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFavDragOver = (e) => {
    e.preventDefault();
  };

  const handleFavDrop = (e, targetItemId) => {
    e.preventDefault();
    const draggedId = draggedFavRef.current;
    draggedFavRef.current = null;
    if (!draggedId || draggedId === targetItemId) return;
    const ids = favorites.map(f => f.itemId);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetItemId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedId);
    reorderFavorites(ids);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
    addRecent(item);
    window.history.pushState({ page: 'graphs' }, '', '/graphs?item=' + item.id);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    if (!e.target.value.trim()) {
      setSelectedItem(null);
      window.history.replaceState({ page: 'graphs' }, '', '/graphs');
    }
  };

  const handleFavoriteClick = (e, item) => {
    e.stopPropagation();
    toggleFavorite(item);
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
    const marginAfterTax = margin != null ? margin - tax : null;
    const buyLimit = selectedItem.limit || 0;
    const potentialProfit = marginAfterTax != null && buyLimit ? marginAfterTax * buyLimit : null;
    const cutoff = Date.now() / 1000 - (tf?.filterDays || 365) * 86400;
    const volume = rawData
      .filter(d => d.timestamp >= cutoff)
      .reduce((sum, d) => sum + (d.highPriceVolume || 0) + (d.lowPriceVolume || 0), 0);
    return {
      margin,
      potentialProfit,
      volume,
      highAlch: selectedItem.highalch,
      members: selectedItem.members,
    };
  }, [selectedItem, currentPrice, rawData, tf]);

  const matchingStocks = useMemo(() => {
    if (!selectedItem) return [];
    return stocks.filter(s => s.itemId === selectedItem.id);
  }, [selectedItem, stocks]);

  const handleOpenNotes = (stock) => {
    setNotesStock(stock);
    setShowNotesModal(true);
  };

  const handleSaveNote = async (noteText) => {
    if (!onSaveNote || !notesStock) return;
    await onSaveNote(notesStock.id, noteText);
    setShowNotesModal(false);
    setNotesStock(null);
  };

  const formatPrice = (val) => {
    if (val == null) return '—';
    return val.toLocaleString();
  };

  const formatTimeAgo = (unixSeconds) => {
    if (!unixSeconds) return '';
    const seconds = Math.floor(Date.now() / 1000 - unixSeconds);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  };

  const renderDropdownItem = (item, showFavStar) => (
    <div
      key={item.id}
      className="graphs-dropdown-item"
      onClick={() => handleSelectItem(item)}
    >
      {iconMap[item.id] && (
        <img
          src={iconMap[item.id]}
          alt=""
          className="graphs-dropdown-icon"
        />
      )}
      <span className="graphs-dropdown-name">{item.name}</span>
      {item.limit && (
        <span className="graphs-dropdown-limit">Limit: {item.limit.toLocaleString()}</span>
      )}
      {showFavStar && (
        <button
          className={`graphs-favorite-star ${isFavorite(item.id) ? 'graphs-favorite-star--active' : ''}`}
          onClick={(e) => handleFavoriteClick(e, item)}
          title={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={14} fill={isFavorite(item.id) ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );

  const sectionIcon = (type) => {
    if (type === 'star') return <Star size={12} />;
    if (type === 'clock') return <Clock size={12} />;
    return <Search size={12} />;
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
          onFocus={() => setShowDropdown(true)}
          disabled={mappingLoading}
        />
        {showDropdown && hasDropdownContent && (
          <div className="graphs-dropdown" ref={dropdownRef}>
            {dropdownSections.map(section => (
              <div key={section.label}>
                <div className="graphs-dropdown-section-header">
                  {sectionIcon(section.icon)}
                  <span>{section.label}</span>
                </div>
                {section.items.map(item => renderDropdownItem(item, section.icon !== 'star'))}
              </div>
            ))}
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="graphs-favorites-section">
          <div className="graphs-favorites-header" onClick={toggleFavoritesCollapsed}>
            <Star size={14} />
            <span>Favorites ({favorites.length})</span>
            <ChevronDown size={16} className={`graphs-favorites-chevron ${favoritesCollapsed ? 'graphs-favorites-chevron--collapsed' : ''}`} />
          </div>
          {!favoritesCollapsed && (
            <div className="graphs-quick-access">
              {favorites.map(fav => {
                const item = mapping.find(m => m.id === fav.itemId);
                if (!item) return null;
                return (
                  <button
                    key={fav.itemId}
                    className={`graphs-quick-access-item ${selectedItem?.id === fav.itemId ? 'graphs-quick-access-item--active' : ''}`}
                    onClick={() => handleSelectItem(item)}
                    title={fav.itemName}
                    draggable
                    onDragStart={(e) => handleFavDragStart(e, fav.itemId)}
                    onDragOver={handleFavDragOver}
                    onDrop={(e) => handleFavDrop(e, fav.itemId)}
                  >
                    {iconMap[fav.itemId] ? (
                      <img
                        src={iconMap[fav.itemId]}
                        alt={fav.itemName}
                        className="graphs-quick-access-icon"
                      />
                    ) : (
                      <span className="graphs-quick-access-fallback">{fav.itemName.charAt(0)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
            <button
              className={`graphs-favorite-star graphs-favorite-star--header ${isFavorite(selectedItem.id) ? 'graphs-favorite-star--active' : ''}`}
              onClick={() => toggleFavorite(selectedItem)}
              title={isFavorite(selectedItem.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={18} fill={isFavorite(selectedItem.id) ? 'currentColor' : 'none'} />
            </button>
            <a
              className="graphs-info-wiki-link"
              href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selectedItem.name.replace(/ /g, '_'))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Wiki
            </a>
            {itemStats && (
              <span className={`graphs-info-badge ${itemStats.members ? 'graphs-info-badge--p2p' : 'graphs-info-badge--f2p'}`}>
                {itemStats.members ? 'P2P' : 'F2P'}
              </span>
            )}
            {onPriceAlert && (
              <button
                className={`graph-alert-btn ${priceAlerts[selectedItem.id]?.isActive ? 'graph-alert-btn-active' : ''}`}
                onClick={() => onPriceAlert({ itemId: selectedItem.id, itemName: selectedItem.name })}
              >
                {priceAlerts[selectedItem.id]?.isActive ? <BellRing size={14} /> : <Bell size={14} />}
                {priceAlerts[selectedItem.id]?.isActive ? 'Edit Alert' : 'Set Alert'}
              </button>
            )}
            {matchingStocks.length === 1 && (
              <button
                className={`graph-alert-btn ${stockNotes[matchingStocks[0].id] ? 'graph-notes-btn-active' : ''}`}
                onClick={() => handleOpenNotes(matchingStocks[0])}
              >
                <StickyNote size={14} />
                {stockNotes[matchingStocks[0].id] ? 'Edit Note' : 'Add Note'}
              </button>
            )}
            {matchingStocks.length > 1 && (
              <div className="graph-notes-multi">
                <button
                  className={`graph-alert-btn ${matchingStocks.some(s => stockNotes[s.id]) ? 'graph-notes-btn-active' : ''}`}
                  onClick={() => setShowNotesModal(true)}
                >
                  <StickyNote size={14} />
                  Notes
                </button>
              </div>
            )}
          </div>
          <div className="graphs-info-stats">
            {currentPrice && (
              <>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">Buy Price</span>
                  <span className="graphs-info-value graphs-info-value--high">{formatPrice(currentPrice.high)}</span>
                </div>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">Buy Time</span>
                  <span className="graphs-info-value graphs-info-value--high">{currentPrice.highTime ? formatTimeAgo(currentPrice.highTime) : '—'}</span>
                </div>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">Sell Price</span>
                  <span className="graphs-info-value graphs-info-value--low">{formatPrice(currentPrice.low)}</span>
                </div>
                <div className="graphs-info-stat">
                  <span className="graphs-info-label">Sell Time</span>
                  <span className="graphs-info-value graphs-info-value--low">{currentPrice.lowTime ? formatTimeAgo(currentPrice.lowTime) : '—'}</span>
                </div>
              </>
            )}
            {itemStats?.margin != null && (
              <div className="graphs-info-stat">
                <span className="graphs-info-label">Margin</span>
                <span className="graphs-info-value">{itemStats.margin.toLocaleString()}</span>
              </div>
            )}
            {itemStats?.potentialProfit != null && (
              <div className="graphs-info-stat graphs-info-stat--tooltip">
                <span className="graphs-info-label">Potential Profit</span>
                <span className={`graphs-info-value ${itemStats.potentialProfit >= 0 ? 'graphs-info-value--high' : 'graphs-info-value--negative'}`}>
                  {itemStats.potentialProfit.toLocaleString()}
                </span>
                <div className="graphs-info-stat-tooltip">
                  (Margin - Tax) × Buy Limit = ({itemStats.margin?.toLocaleString()} - {currentPrice?.high != null ? calculateGETax(selectedItem.id, currentPrice.high).toLocaleString() : '0'}) × {(selectedItem.limit || 0).toLocaleString()}
                </div>
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
              <div className="graphs-info-stat graphs-info-stat--tooltip">
                <span className="graphs-info-label">Change ({timeframe})</span>
                <span className={`graphs-info-value ${priceChange.change >= 0 ? 'graphs-info-value--high' : 'graphs-info-value--negative'}`}>
                  {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toLocaleString()} ({priceChange.pct >= 0 ? '+' : ''}{priceChange.pct.toFixed(2)}%)
                </span>
                <div className="graphs-info-stat-tooltip">
                  Current high price vs. earliest high price in the {timeframe} window
                </div>
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
          <div className="graphs-timeframe-separator" />
          <button
            className={`graphs-timeframe-btn${chartMode === 'line' ? ' graphs-timeframe-btn--active' : ''}`}
            onClick={() => setChartMode('line')}
          >
            Line
          </button>
          <button
            className={`graphs-timeframe-btn${chartMode === 'candle' ? ' graphs-timeframe-btn--active' : ''}`}
            onClick={() => setChartMode('candle')}
          >
            Candle
          </button>
        </div>
      )}

      <div className="graphs-chart-container" ref={chartContainerRef}>
        {!selectedItem && (
          <div className="graphs-empty-state">
            {(favorites.length > 0 || recents.length > 0) ? (
              <div className="graphs-empty-cards">
                {recents.length > 0 && (
                  <div className="graphs-empty-section">
                    <div className="graphs-empty-section-header">
                      <Clock size={14} />
                      <span>Recent</span>
                    </div>
                    <div className="graphs-empty-grid">
                      {recents.map(rec => {
                        const item = mapping.find(m => m.id === rec.itemId);
                        if (!item) return null;
                        return (
                          <button
                            key={rec.itemId}
                            className="graphs-empty-card"
                            onClick={() => handleSelectItem(item)}
                          >
                            {iconMap[rec.itemId] && (
                              <img
                                src={iconMap[rec.itemId]}
                                alt=""
                                className="graphs-empty-card-icon"
                              />
                            )}
                            <span className="graphs-empty-card-name">{rec.itemName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {favorites.length > 0 && (
                  <div className="graphs-empty-section">
                    <div className="graphs-empty-section-header">
                      <Star size={14} />
                      <span>Favorites</span>
                    </div>
                    <div className="graphs-empty-grid">
                      {favorites.map(fav => {
                        const item = mapping.find(m => m.id === fav.itemId);
                        if (!item) return null;
                        return (
                          <button
                            key={fav.itemId}
                            className="graphs-empty-card"
                            onClick={() => handleSelectItem(item)}
                          >
                            {iconMap[fav.itemId] && (
                              <img
                                src={iconMap[fav.itemId]}
                                alt=""
                                className="graphs-empty-card-icon"
                              />
                            )}
                            <span className="graphs-empty-card-name">{fav.itemName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              'Search for an item above to view its price chart'
            )}
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
      <div className="graphs-volume-container" ref={volumeContainerRef}></div>

      <ModalContainer isOpen={showNotesModal && notesStock != null}>
        <NotesModal
          stock={notesStock || {}}
          notes={stockNotes[notesStock?.id] || ''}
          onConfirm={handleSaveNote}
          onCancel={() => { setShowNotesModal(false); setNotesStock(null); }}
        />
      </ModalContainer>

      <ModalContainer isOpen={showNotesModal && notesStock == null && matchingStocks.length > 1}>
        <div className="graph-notes-picker">
          <h2 className="graph-notes-picker-title">Select Stock</h2>
          <p className="graph-notes-picker-subtitle">This item is linked to multiple stocks. Which one?</p>
          <div className="graph-notes-picker-list">
            {matchingStocks.map(stock => (
              <button
                key={stock.id}
                className="graph-notes-picker-item"
                onClick={() => handleOpenNotes(stock)}
              >
                <span>{stock.category}</span>
                {stock.isInvestment && <span className="graphs-note-investment-tag">Investment</span>}
                {stockNotes[stock.id] && <span className="graph-notes-picker-has-note">Has note</span>}
              </button>
            ))}
          </div>
          <button
            className="graph-notes-picker-cancel"
            onClick={() => setShowNotesModal(false)}
          >
            Cancel
          </button>
        </div>
      </ModalContainer>
    </div>
  );
}
