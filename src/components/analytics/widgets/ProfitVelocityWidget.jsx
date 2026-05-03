import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../../utils/formatters';
import { addDays, subtractDays, totalProfit } from '../../../utils/analyticsHelpers';

const WINDOWS = [7, 30, 90];
const SPARKLINE_POINTS = 60;
const BILLION_GP = 1_000_000_000;
const MAX_WINDOW = Math.max(...WINDOWS);
const LOOKBACK_DAYS = MAX_WINDOW * 2 + SPARKLINE_POINTS - 2;

function buildDailySeries(buckets, endDate) {
  const byDate = new Map();
  const dates = [];

  for (const bucket of buckets) {
    const date = bucket.bucket_date;
    if (!date) continue;
    byDate.set(date, (byDate.get(date) || 0) + totalProfit(bucket));
    dates.push(date);
  }

  const sortedDates = dates.sort();
  const endIso = endDate || sortedDates[sortedDates.length - 1] || new Date().toISOString().slice(0, 10);
  const startIso = subtractDays(endIso, LOOKBACK_DAYS);
  const series = [];

  for (let date = startIso; date <= endIso; date = addDays(date, 1)) {
    series.push({
      date,
      profit: byDate.get(date) || 0,
    });
  }

  return series;
}

function rollingStatsAt(series, endIndex, windowDays) {
  if (endIndex < 0) return null;

  let total = 0;
  let activeDays = 0;
  const startIndex = Math.max(0, endIndex - windowDays + 1);

  for (let index = startIndex; index <= endIndex; index += 1) {
    const profit = series[index]?.profit || 0;
    total += profit;
    if (profit !== 0) activeDays += 1;
  }

  return {
    total,
    average: total / windowDays,
    startDate: series[startIndex]?.date,
    endDate: series[endIndex]?.date,
    activeDays,
  };
}

function rollingAverageAt(series, endIndex, windowDays) {
  return rollingStatsAt(series, endIndex, windowDays)?.average ?? null;
}

function rollingAverageSeries(series, windowDays) {
  const startIndex = Math.max(0, series.length - SPARKLINE_POINTS);

  return series.slice(startIndex).map((_, offset) => {
    const index = startIndex + offset;
    return {
      date: series[index].date,
      value: rollingAverageAt(series, index, windowDays) || 0,
    };
  });
}

function pctDelta(current, prior) {
  if (prior == null) return null;
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function deltaMeta(current, prior) {
  const delta = pctDelta(current, prior);

  if (delta == null) {
    return {
      label: prior === 0 && current !== 0 ? 'New pace' : 'No prior',
      className: 'is-neutral',
      Icon: Minus,
    };
  }

  if (Math.abs(delta) < 0.1) {
    return {
      label: 'neutral',
      className: 'is-neutral',
      Icon: Minus,
    };
  }

  return {
    label: `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`,
    className: delta > 0 ? 'is-positive' : 'is-negative',
    Icon: delta > 0 ? ArrowUp : ArrowDown,
  };
}

function accelerationMeta(metrics) {
  const seven = metrics.find((metric) => metric.windowDays === 7)?.current || 0;
  const thirty = metrics.find((metric) => metric.windowDays === 30)?.current || 0;
  const ninety = metrics.find((metric) => metric.windowDays === 90)?.current || 0;

  if (seven > thirty && thirty > ninety) {
    return { label: 'Accelerating', className: 'is-positive' };
  }

  if (seven < thirty && thirty < ninety) {
    return { label: 'Slowing', className: 'is-negative' };
  }

  return { label: 'Mixed pace', className: 'is-neutral' };
}

function etaMeta(total, pace, numberFormat, windowDays) {
  const labelPrefix = `At ${windowDays}d pace`;

  if (pace <= 0) {
    return {
      label: `${labelPrefix}: not moving closer`,
      tooltip: `Current total profit = ${formatNumber(total, 'full')} GP\n${windowDays}d velocity = ${formatNumber(pace, numberFormat)}/day`,
    };
  }

  const nextBillion = Math.max(BILLION_GP, (Math.floor(total / BILLION_GP) + 1) * BILLION_GP);
  const remaining = Math.max(0, nextBillion - total);
  const days = Math.ceil((nextBillion - total) / pace);

  return {
    label: days <= 0
      ? `${labelPrefix}: next 1B milestone is within reach`
      : `${labelPrefix}: next 1B milestone in ${days.toLocaleString()} days`,
    tooltip: [
      `Next 1B milestone = ${formatNumber(nextBillion, 'full')} GP`,
      `Current total profit = ${formatNumber(total, 'full')} GP`,
      `Remaining = ${formatNumber(remaining, 'full')} GP`,
      `ETA = remaining / ${windowDays}d velocity = ${formatNumber(remaining, 'full')} / ${formatNumber(pace, numberFormat)} = ${days.toLocaleString()} days`,
    ].join('\n'),
  };
}

function VelocityCard({ metric, numberFormat }) {
  const { Icon, className, label } = deltaMeta(metric.current, metric.prior);
  const stroke = metric.current >= metric.prior ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  const delta = pctDelta(metric.current, metric.prior);
  const tooltip = [
    `${metric.windowDays}d velocity = ${formatNumber(metric.currentStats.total, 'full')} GP / ${metric.windowDays} days = ${formatNumber(metric.current, numberFormat)}/day`,
    `Current window: ${metric.currentStats.startDate} to ${metric.currentStats.endDate}`,
    `${metric.currentStats.activeDays} days had profit activity; missing days count as 0.`,
    metric.priorStats
      ? `Prior window: ${metric.priorStats.startDate} to ${metric.priorStats.endDate} = ${formatNumber(metric.priorStats.total, 'full')} GP / ${metric.windowDays} days = ${formatNumber(metric.prior, numberFormat)}/day`
      : 'Prior window: not enough data',
    delta == null
      ? 'Delta: not available because prior velocity is 0.'
      : `Delta = (${formatNumber(metric.current, numberFormat)} - ${formatNumber(metric.prior, numberFormat)}) / ${formatNumber(Math.abs(metric.prior), numberFormat)} = ${delta.toFixed(1)}%`,
  ].join('\n');

  return (
    <div className="analytics-velocity-card has-tooltip" data-tooltip={tooltip}>
      <div className="analytics-velocity-label">{metric.windowDays}d</div>
      <div className="analytics-velocity-value">
        {formatNumber(metric.current, numberFormat)}/day
      </div>
      <div className={`analytics-velocity-delta ${className}`}>
        <Icon size={14} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="analytics-velocity-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.sparkline}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ProfitVelocityWidget({
  allBuckets = [],
  endDate,
  numberFormat,
  totalProfitValue,
}) {
  const series = useMemo(() => buildDailySeries(allBuckets, endDate), [allBuckets, endDate]);
  const metrics = useMemo(() => {
    const currentIndex = series.length - 1;

    return WINDOWS.map((windowDays) => ({
      windowDays,
      currentStats: rollingStatsAt(series, currentIndex, windowDays),
      priorStats: rollingStatsAt(series, currentIndex - windowDays, windowDays),
      current: rollingAverageAt(series, currentIndex, windowDays) || 0,
      prior: rollingAverageAt(series, currentIndex - windowDays, windowDays),
      sparkline: rollingAverageSeries(series, windowDays),
    }));
  }, [series]);
  const acceleration = useMemo(() => accelerationMeta(metrics), [metrics]);
  const bucketTotal = useMemo(
    () => allBuckets.reduce((sum, bucket) => sum + totalProfit(bucket), 0),
    [allBuckets]
  );
  const total = totalProfitValue ?? bucketTotal;
  const etas = metrics.map((metric) => etaMeta(
    total,
    metric.current,
    numberFormat,
    metric.windowDays
  ));

  if (!allBuckets.length) {
    return (
      <div className="analytics-widget">
        <div className="analytics-widget-header">
          <h3
            className="analytics-widget-title has-tooltip"
            data-tooltip="Rolling GP per day based on all-time daily profit buckets."
          >
            Profit velocity
          </h3>
        </div>
        <div className="analytics-widget-empty">No profit history available yet.</div>
      </div>
    );
  }

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Rolling average GP earned per calendar day. Missing days count as zero, so inactive days lower the pace."
        >
          Profit velocity
        </h3>
        <span className={`analytics-velocity-status ${acceleration.className}`}>
          {acceleration.label}
        </span>
      </div>
      <div className="analytics-velocity-grid">
        {metrics.map((metric) => (
          <VelocityCard
            key={metric.windowDays}
            metric={metric}
            numberFormat={numberFormat}
          />
        ))}
      </div>
      <div className="analytics-velocity-paces">
        {etas.map((eta, index) => (
          <div
            key={metrics[index].windowDays}
            className="analytics-velocity-eta has-tooltip"
            data-tooltip={eta.tooltip}
          >
            {eta.label}
          </div>
        ))}
      </div>
    </div>
  );
}
