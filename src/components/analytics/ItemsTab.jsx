import React, { useEffect, useMemo, useState } from 'react';
import {
  computeBuyingVsSelling,
  computeItemMetrics,
  computeMovers,
} from '../../utils/itemAnalytics';
import { useGEData } from '../../contexts/GEDataContext';
import ItemsFilterBar from './widgets/ItemsFilterBar';
import ItemsTable from './widgets/ItemsTable';
import ItemDrilldownDrawer from './widgets/ItemDrilldownDrawer';
import MoversList from './widgets/MoversList';
import BuyingVsSellingChart from './widgets/BuyingVsSellingChart';
import { useUrlState } from '../../hooks/useUrlState';
import '../../styles/analytics-items.css';

const parseCategoryParam = (value) => value || 'all';
const serializeCategoryParam = (value) => (value && value !== 'all' ? value : null);

const parseBooleanParam = (value) => (
  value === '1' || value === 'true' || value === 'yes'
);
const serializeBooleanParam = (value) => (value ? '1' : null);

const parseMinimumSellsParam = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};
const serializeMinimumSellsParam = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(Math.floor(parsed));
};

export default function ItemsTab({
  stocks = [],
  transactions = [],
  profitHistory = [],
  timeframe,
  timeframeOptions = [],
  numberFormat,
  onTimeframeChange,
}) {
  const { gePrices } = useGEData();
  const [selectedCategory, setSelectedCategory] = useUrlState(
    'category',
    'all',
    parseCategoryParam,
    serializeCategoryParam,
    { history: 'push' }
  );
  const [hasStockOnly, setHasStockOnly] = useUrlState(
    'hasStock',
    false,
    parseBooleanParam,
    serializeBooleanParam,
    { history: 'push' }
  );
  const [soldInWindowOnly, setSoldInWindowOnly] = useUrlState(
    'soldInWindow',
    false,
    parseBooleanParam,
    serializeBooleanParam,
    { history: 'push' }
  );
  const [showArchived, setShowArchived] = useUrlState(
    'archived',
    false,
    parseBooleanParam,
    serializeBooleanParam,
    { history: 'push' }
  );
  const [minimumSells, setMinimumSells] = useUrlState(
    'minSells',
    0,
    parseMinimumSellsParam,
    serializeMinimumSellsParam,
    { history: 'replace' }
  );
  const [drillItem, setDrillItem] = useState(null);

  const items = useMemo(() => (
    computeItemMetrics({
      stocks,
      transactions,
      gePrices,
      start: timeframe.start,
      end: timeframe.end,
    })
  ), [stocks, transactions, gePrices, timeframe.start, timeframe.end]);

  const categories = useMemo(() => (
    [...new Set(items.map((item) => item.category).filter(Boolean))].sort()
  ), [items]);

  useEffect(() => {
    if (selectedCategory === 'all' || categories.length === 0) return;
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('all', { history: 'replace' });
    }
  }, [categories, selectedCategory, setSelectedCategory]);

  const filteredItems = useMemo(() => (
    items.filter((item) => {
      if (!showArchived && item.archived) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (hasStockOnly && item.shares <= 0) return false;
      if (soldInWindowOnly && item.windowSells <= 0) return false;
      if (minimumSells > 0 && item.windowSells < minimumSells) return false;
      return true;
    })
  ), [items, selectedCategory, hasStockOnly, soldInWindowOnly, showArchived, minimumSells]);

  const movers = useMemo(() => computeMovers(filteredItems, 15), [filteredItems]);
  const buyingVsSelling = useMemo(() => (
    computeBuyingVsSelling({
      stocks: filteredItems,
    })
  ), [filteredItems]);

  return (
    <div className="analytics-stack">
      <ItemsFilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => setSelectedCategory(value, { history: 'push' })}
        hasStockOnly={hasStockOnly}
        onToggleHasStock={() => setHasStockOnly((value) => !value, { history: 'push' })}
        soldInWindowOnly={soldInWindowOnly}
        onToggleSoldInWindow={() => setSoldInWindowOnly((value) => !value, { history: 'push' })}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((value) => !value, { history: 'push' })}
        minimumSells={minimumSells}
        onMinimumSellsChange={(value) => setMinimumSells(value, { history: 'replace' })}
      />

      <ItemsTable
        items={filteredItems}
        totalItems={items.length}
        numberFormat={numberFormat}
        onRowClick={setDrillItem}
      />

      <MoversList
        gainers={movers.gainers}
        numberFormat={numberFormat}
        onItemClick={setDrillItem}
      />

      <BuyingVsSellingChart rows={buyingVsSelling} numberFormat={numberFormat} />

      {drillItem && (
        <ItemDrilldownDrawer
          item={drillItem}
          transactions={transactions}
          profitHistory={profitHistory}
          timeframe={timeframe}
          timeframeOptions={timeframeOptions}
          numberFormat={numberFormat}
          onClose={() => setDrillItem(null)}
          onTimeframeChange={onTimeframeChange}
        />
      )}
    </div>
  );
}
