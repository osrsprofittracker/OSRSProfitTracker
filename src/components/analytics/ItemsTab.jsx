import React, { useMemo, useState } from 'react';
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
import '../../styles/analytics-items.css';

export default function ItemsTab({
  stocks = [],
  transactions = [],
  profitHistory = [],
  timeframe,
  numberFormat,
}) {
  const { gePrices } = useGEData();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasStockOnly, setHasStockOnly] = useState(false);
  const [soldInWindowOnly, setSoldInWindowOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [minimumSells, setMinimumSells] = useState(0);
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
        onCategoryChange={setSelectedCategory}
        hasStockOnly={hasStockOnly}
        onToggleHasStock={() => setHasStockOnly((value) => !value)}
        soldInWindowOnly={soldInWindowOnly}
        onToggleSoldInWindow={() => setSoldInWindowOnly((value) => !value)}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((value) => !value)}
        minimumSells={minimumSells}
        onMinimumSellsChange={setMinimumSells}
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
          numberFormat={numberFormat}
          onClose={() => setDrillItem(null)}
        />
      )}
    </div>
  );
}
