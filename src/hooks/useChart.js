import { useRef, useEffect } from 'react';
import { createChart, LineSeries, HistogramSeries, CandlestickSeries } from 'lightweight-charts';

export function useChart({ chartData, candlestickData, chartMode, timeframe, selectedItem }) {
  const chartContainerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const chartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const highSeriesRef = useRef(null);
  const lowSeriesRef = useRef(null);
  const buyVolSeriesRef = useRef(null);
  const sellVolSeriesRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const chartDataRef = useRef([]);
  const chartModeRef = useRef('line');

  chartDataRef.current = chartData;
  chartModeRef.current = chartMode;

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
        toolEl.innerHTML = `<span class="graphs-tooltip-neutral">O: ${open.toLocaleString()}</span><br/><span class="graphs-tooltip-high">H: ${highNum.toLocaleString()}</span><br/><span class="graphs-tooltip-low">L: ${lowNum.toLocaleString()}</span><br/><span class="graphs-tooltip-neutral">C: ${close.toLocaleString()}</span>`;
      } else {
        const highStr = highNum != null ? highNum.toLocaleString() : '—';
        const lowStr = lowNum != null ? lowNum.toLocaleString() : '—';
        toolEl.innerHTML = `<span class="graphs-tooltip-high">High: ${highStr}</span><br/><span class="graphs-tooltip-low">Low: ${lowStr}</span>`;
      }
      toolEl.style.display = 'block';
      const containerWidth = chartContainerRef.current.clientWidth;
      const tooltipWidth = 180;
      let left = param.point.x + 12;
      if (left + tooltipWidth > containerWidth) left = param.point.x - tooltipWidth - 12;
      toolEl.style.left = left + 'px';
      toolEl.style.top = param.point.y + 'px';
    });

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
      volToolEl.innerHTML = `<span class="graphs-tooltip-high">Buy: ${buyVol}</span><br/><span class="graphs-tooltip-low">Sell: ${sellVol}</span>`;
      volToolEl.style.display = 'block';
      const containerWidth = volumeContainerRef.current.clientWidth;
      const tooltipWidth = 180;
      let left = param.point.x + 12;
      if (left + tooltipWidth > containerWidth) left = param.point.x - tooltipWidth - 12;
      volToolEl.style.left = left + 'px';
      volToolEl.style.top = param.point.y + 'px';
    });

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
      chartRef.current.applyOptions({ timeScale: { timeVisible: showTime } });
      chartRef.current.timeScale().fitContent();
    }
    if (volumeChartRef.current) {
      volumeChartRef.current.applyOptions({ timeScale: { timeVisible: showTime } });
      volumeChartRef.current.timeScale().fitContent();
    }
  }, [chartData, timeframe, selectedItem, chartMode, candlestickData]);

  return { chartContainerRef, volumeContainerRef };
}
