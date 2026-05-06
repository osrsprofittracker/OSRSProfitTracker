import { useEffect, useRef } from 'react';
import { formatNumber } from '../utils/formatters';

export function useWatchlistAlertChecker({ watchlistItems, gePrices, addNotification }) {
  const firedAlerts = useRef(new Set());

  useEffect(() => {
    if (!watchlistItems || watchlistItems.length === 0) return;
    if (!gePrices || Object.keys(gePrices).length === 0) return;

    // Prune stale keys when watchlist changes.
    const validKeys = new Set();
    for (const item of watchlistItems) {
      if (item.targetBuyPrice) validKeys.add(`${item.id}:buy:${item.targetBuyPrice}`);
      if (item.targetSellPrice) validKeys.add(`${item.id}:sell:${item.targetSellPrice}`);
    }
    for (const key of firedAlerts.current) {
      if (!validKeys.has(key)) firedAlerts.current.delete(key);
    }

    for (const item of watchlistItems) {
      const livePrice = gePrices[item.itemId];
      if (!livePrice) continue;

      if (item.targetBuyPrice && livePrice.low != null) {
        const buyKey = `${item.id}:buy:${item.targetBuyPrice}`;
        if (livePrice.low <= item.targetBuyPrice && !firedAlerts.current.has(buyKey)) {
          firedAlerts.current.add(buyKey);
          addNotification(
            'watchlistAlertLow',
            `Watchlist target hit: ${item.itemName} is at or below ${formatNumber(item.targetBuyPrice, 'full')} GP (current low: ${formatNumber(livePrice.low, 'full')} GP)`,
            { page: 'watchlist' }
          );
        }
      }

      if (item.targetSellPrice && livePrice.high != null) {
        const sellKey = `${item.id}:sell:${item.targetSellPrice}`;
        if (livePrice.high >= item.targetSellPrice && !firedAlerts.current.has(sellKey)) {
          firedAlerts.current.add(sellKey);
          addNotification(
            'watchlistAlertHigh',
            `Watchlist target hit: ${item.itemName} is at or above ${formatNumber(item.targetSellPrice, 'full')} GP (current high: ${formatNumber(livePrice.high, 'full')} GP)`,
            { page: 'watchlist' }
          );
        }
      }
    }
  }, [watchlistItems, gePrices, addNotification]);
}
