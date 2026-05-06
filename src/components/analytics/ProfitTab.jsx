import React, { useMemo } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import ProfitOverTimeChart from './widgets/ProfitOverTimeChart';
import ProfitVelocityWidget from './widgets/ProfitVelocityWidget';
import CumulativeProfitChart from './widgets/CumulativeProfitChart';
import ProfitBySourceChart from './widgets/ProfitBySourceChart';
import GpTradedChart from './widgets/GpTradedChart';
import PeriodComparisonCards from './widgets/PeriodComparisonCards';
import BestDaysTable from './widgets/BestDaysTable';
import ProfitKpiStrip from './widgets/ProfitKpiStrip';
import ProfitHeatmap from './widgets/ProfitHeatmap';
import {
  addDays,
  daysBetween,
  subtractDays,
  subtractYears,
  totalProfit,
} from '../../utils/analyticsHelpers';

const periodLabelFor = (window) => {
  switch (window) {
    case '1W':
      return 'week';
    case '1M':
      return 'month';
    case '3M':
      return 'quarter';
    case '6M':
      return '6 months';
    case '1Y':
      return 'year';
    default:
      return 'period';
  }
};

export default function ProfitTab({
  userId,
  buckets = [],
  priorBuckets = [],
  timeframe,
  transactions = [],
  stocks = [],
  profitHistory = [],
  numberFormat,
  onNavigateToHistory,
  allTimeBuckets = [],
  totalProfitValue,
  fallbackData,
}) {
  const span = daysBetween(timeframe.start, timeframe.end);
  const lastPeriodStart = subtractDays(timeframe.start, span);
  const lastPeriodEnd = addDays(timeframe.start, -1);
  const samePeriodLastYearStart = subtractYears(timeframe.start, 1);
  const samePeriodLastYearEnd = subtractYears(timeframe.end, 1);

  const lastPeriod = useAnalytics({
    userId,
    start: lastPeriodStart,
    end: lastPeriodEnd,
    bucket: timeframe.bucket,
    fallbackData,
  });
  const samePeriodLastYear = useAnalytics({
    userId,
    start: samePeriodLastYearStart,
    end: samePeriodLastYearEnd,
    bucket: timeframe.bucket,
    fallbackData,
  });
  const dailyBuckets = useMemo(() => (
    allTimeBuckets.filter((bucket) => (
      bucket.bucket_date >= timeframe.start && bucket.bucket_date <= timeframe.end
    ))
  ), [allTimeBuckets, timeframe.start, timeframe.end]);
  const last365Buckets = useMemo(() => {
    const start = subtractDays(timeframe.end, 364);
    return allTimeBuckets.filter((bucket) => (
      bucket.bucket_date >= start && bucket.bucket_date <= timeframe.end
    ));
  }, [allTimeBuckets, timeframe.end]);
  const initialBaseline = useMemo(() => (
    allTimeBuckets.reduce((sum, bucket) => {
      if (bucket.bucket_date >= timeframe.start) return sum;
      return sum + totalProfit(bucket);
    }, 0)
  ), [allTimeBuckets, timeframe.start]);

  return (
    <div className="analytics-stack">
      <ProfitVelocityWidget
        allBuckets={allTimeBuckets}
        endDate={timeframe.end}
        numberFormat={numberFormat}
        totalProfitValue={totalProfitValue}
      />
      <ProfitOverTimeChart buckets={buckets} numberFormat={numberFormat} />
      <CumulativeProfitChart
        buckets={dailyBuckets}
        initialBaseline={initialBaseline}
        numberFormat={numberFormat}
      />
      <div className="analytics-grid-2">
        <ProfitBySourceChart buckets={buckets} numberFormat={numberFormat} />
        <GpTradedChart buckets={buckets} numberFormat={numberFormat} />
      </div>
      <PeriodComparisonCards
        thisPeriod={buckets}
        lastPeriod={lastPeriod.buckets}
        samePeriodLastYear={samePeriodLastYear.buckets}
        periodLabel={periodLabelFor(timeframe.window)}
        numberFormat={numberFormat}
      />
      <div className="analytics-grid-2">
        <BestDaysTable
          allBuckets={allTimeBuckets}
          transactions={transactions}
          stocks={stocks}
          profitHistory={profitHistory}
          endDate={timeframe.end}
          numberFormat={numberFormat}
          onNavigateToHistory={onNavigateToHistory}
        />
        <ProfitKpiStrip
          currentBuckets={buckets}
          priorBuckets={priorBuckets}
          numberFormat={numberFormat}
        />
      </div>
      <ProfitHeatmap
        allBuckets={last365Buckets}
        endDate={timeframe.end}
        numberFormat={numberFormat}
        onCellClick={(date) => onNavigateToHistory?.(date, date)}
      />
    </div>
  );
}
