import React, { useMemo, useState } from 'react';
import CategoryStackedAreaChart from './widgets/CategoryStackedAreaChart';
import CategoryBreakdownTable from './widgets/CategoryBreakdownTable';
import CategoryShareDonut from './widgets/CategoryShareDonut';
import CategoryPeriodComparison from './widgets/CategoryPeriodComparison';
import CategoryContributionBar from './widgets/CategoryContributionBar';
import CategoryMarginChart from './widgets/CategoryMarginChart';
import InventoryTreemap from './widgets/InventoryTreemap';
import {
  computeCategoryBreakdown,
  filterBucketsByCategories,
} from '../../utils/categoryAnalytics';
import { useGEData } from '../../contexts/GEDataContext';

const categoryOf = (stock) => stock?.category || 'Uncategorized';

const bucketCategories = (buckets = []) => (
  buckets.flatMap((bucket) => Object.keys(bucket.by_category || {}))
);

export default function CategoriesTab({
  buckets = [],
  priorBuckets = [],
  stocks = [],
  transactions = [],
  profitHistory = [],
  timeframe,
  numberFormat,
}) {
  const { gePrices } = useGEData();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const timeframeLabel = timeframe?.window || 'selected';

  const categories = useMemo(() => {
    const names = new Set([
      ...stocks.map(categoryOf),
      ...bucketCategories(buckets),
      ...bucketCategories(priorBuckets),
    ]);

    return [...names].filter(Boolean).sort();
  }, [stocks, buckets, priorBuckets]);

  const filteredStocks = useMemo(() => {
    if (!selectedCategories.length) return stocks;
    const selected = new Set(selectedCategories);
    return stocks.filter((stock) => selected.has(categoryOf(stock)));
  }, [stocks, selectedCategories]);

  const filteredBuckets = useMemo(
    () => filterBucketsByCategories(buckets, selectedCategories),
    [buckets, selectedCategories]
  );
  const filteredPriorBuckets = useMemo(
    () => filterBucketsByCategories(priorBuckets, selectedCategories),
    [priorBuckets, selectedCategories]
  );

  const breakdown = useMemo(
    () => computeCategoryBreakdown({
      stocks: filteredStocks,
      buckets: filteredBuckets,
      gePrices,
      transactions,
      profitHistory,
      start: timeframe?.start,
      end: timeframe?.end,
    }),
    [filteredStocks, filteredBuckets, gePrices, transactions, profitHistory, timeframe?.start, timeframe?.end]
  );

  const toggleCategory = (category) => {
    setSelectedCategories((current) => (
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category].sort()
    ));
  };

  return (
    <div className="analytics-stack">
      {categories.length > 0 && (
        <div className="category-filter-bar" aria-label="Category filters">
          <span
            className="category-filter-label has-tooltip"
            data-tooltip="Filters every category widget on this tab."
          >
            Category
          </span>
          <button
            type="button"
            className={`category-filter-pill has-tooltip${selectedCategories.length === 0 ? ' is-on' : ''}`}
            data-tooltip="Show every category."
            onClick={() => setSelectedCategories([])}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={`category-filter-pill has-tooltip${selectedCategories.includes(category) ? ' is-on' : ''}`}
              data-tooltip={`Filter all widgets to ${category}.`}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <CategoryStackedAreaChart buckets={filteredBuckets} numberFormat={numberFormat} />
      <CategoryContributionBar
        buckets={filteredBuckets}
        categories={selectedCategories.length > 0 ? selectedCategories : categories}
        numberFormat={numberFormat}
      />
      <div className="analytics-grid-2">
        <CategoryShareDonut
          stocks={filteredStocks}
          gePrices={gePrices}
          numberFormat={numberFormat}
        />
        <CategoryMarginChart rows={breakdown} />
      </div>
      <CategoryBreakdownTable
        rows={breakdown}
        totalCategories={categories.length}
        timeframeLabel={timeframeLabel}
        numberFormat={numberFormat}
      />
      <CategoryPeriodComparison
        currentBuckets={filteredBuckets}
        priorBuckets={filteredPriorBuckets}
        timeframeLabel={timeframeLabel}
        numberFormat={numberFormat}
      />
      <InventoryTreemap stocks={filteredStocks} numberFormat={numberFormat} />
    </div>
  );
}
