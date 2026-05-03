import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../../utils/formatters';

const totalProfit = (bucket) => (
  Number(bucket.profit_items || 0)
  + Number(bucket.profit_dump || 0)
  + Number(bucket.profit_referral || 0)
  + Number(bucket.profit_bonds || 0)
);

const sumProfit = (buckets = []) => buckets.reduce((sum, bucket) => sum + totalProfit(bucket), 0);

const deltaClass = (delta) => (delta >= 0 ? 'is-positive' : 'is-negative');

const pctDelta = (current, prior) => {
  if (prior == null || prior === 0) return null;
  return ((current - prior) / Math.abs(prior)) * 100;
};

function Card({ label, current, prior, sparkline, numberFormat, hasData }) {
  if (!hasData) {
    return (
      <div
        className="analytics-widget is-compact has-tooltip"
        data-tooltip="This period has no bucketed profit history to compare."
      >
        <div className="analytics-widget-subtitle">{label}</div>
        <div className="analytics-comparison-note">Not enough history</div>
      </div>
    );
  }

  const delta = pctDelta(current, prior);
  const stroke = delta == null || delta >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

  return (
    <div
      className="analytics-widget is-compact has-tooltip"
      data-tooltip="The small line is the profit trend across buckets inside this period."
    >
      <div className="analytics-widget-subtitle">{label}</div>
      <div className="analytics-comparison-value">
        {formatNumber(current, numberFormat)}
      </div>
      {delta != null && (
        <div className={`analytics-comparison-delta ${deltaClass(delta)}`}>
          {delta >= 0 ? '+' : '-'}{Math.abs(delta).toFixed(1)}% vs prior
        </div>
      )}
      <div className="analytics-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkline.map((value, index) => ({ index, value }))}>
            <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function PeriodComparisonCards({
  thisPeriod = [],
  lastPeriod = [],
  samePeriodLastYear = [],
  periodLabel,
  numberFormat,
}) {
  return (
    <div className="analytics-grid-3">
      <Card
        label={`This ${periodLabel}`}
        current={sumProfit(thisPeriod)}
        prior={sumProfit(lastPeriod)}
        sparkline={thisPeriod.map(totalProfit)}
        numberFormat={numberFormat}
        hasData={thisPeriod.length > 0}
      />
      <Card
        label={`Last ${periodLabel}`}
        current={sumProfit(lastPeriod)}
        prior={0}
        sparkline={lastPeriod.map(totalProfit)}
        numberFormat={numberFormat}
        hasData={lastPeriod.length > 0}
      />
      <Card
        label={`Same ${periodLabel} last year`}
        current={sumProfit(samePeriodLastYear)}
        prior={0}
        sparkline={samePeriodLastYear.map(totalProfit)}
        numberFormat={numberFormat}
        hasData={samePeriodLastYear.length > 0}
      />
    </div>
  );
}
