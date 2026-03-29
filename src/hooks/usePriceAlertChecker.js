import { useEffect, useRef } from 'react';
import { formatNumber } from '../utils/formatters';

const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'OSRSProfitTracker - osrsprofittracker@gmail.com';

async function fetchTimeseries(itemId, timestep) {
  const res = await fetch(
    `${BASE_URL}/timeseries?id=${itemId}&timestep=${timestep}`,
    { headers: { 'User-Agent': USER_AGENT } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

function checkThresholdCrossing(dataPoints, alert) {
  for (const point of dataPoints) {
    if (alert.highThreshold && point.avgHighPrice != null && point.avgHighPrice >= alert.highThreshold) {
      return { type: 'high', price: point.avgHighPrice, timestamp: new Date(point.timestamp * 1000).toISOString() };
    }
    if (alert.lowThreshold && point.avgLowPrice != null && point.avgLowPrice <= alert.lowThreshold) {
      return { type: 'low', price: point.avgLowPrice, timestamp: new Date(point.timestamp * 1000).toISOString() };
    }
  }
  return null;
}

export function usePriceAlertChecker({ alerts, gePrices, addNotification, deactivateAlert, updateLastChecked }) {
  const triggeredRef = useRef(new Set());
  const retroCheckDone = useRef(false);

  // Retroactive check on mount — runs once when alerts and prices are loaded
  useEffect(() => {
    if (retroCheckDone.current) return;
    const activeAlerts = Object.values(alerts).filter(a => a.isActive);
    if (activeAlerts.length === 0) return;

    retroCheckDone.current = true;

    const checkRetroactive = async () => {
      const checkedItemIds = [];

      for (const alert of activeAlerts) {
        if (triggeredRef.current.has(alert.itemId)) continue;

        const lastChecked = alert.lastCheckedAt ? new Date(alert.lastCheckedAt) : null;
        const gapMs = lastChecked ? Date.now() - lastChecked.getTime() : Infinity;

        // Only do retroactive check if gap is >2 minutes
        if (gapMs <= 120_000) {
          checkedItemIds.push(alert.itemId);
          continue;
        }

        const gapHours = gapMs / (1000 * 60 * 60);
        const timestep = gapHours <= 30 ? '5m' : '1h';

        try {
          const data = fetchTimeseries(alert.itemId, timestep);
          const points = await data;

          // Filter points to only those after last_checked_at
          const cutoff = lastChecked ? lastChecked.getTime() / 1000 : 0;
          const relevantPoints = points
            .filter(p => p.timestamp > cutoff)
            .sort((a, b) => a.timestamp - b.timestamp);

          const crossing = checkThresholdCrossing(relevantPoints, alert);

          if (crossing) {
            triggeredRef.current.add(alert.itemId);
            const crossingDate = new Date(crossing.timestamp);
            const timeStr = crossingDate.toLocaleString();

            addNotification(
              crossing.type === 'high' ? 'priceAlertHigh' : 'priceAlertLow',
              `${alert.itemName} went ${crossing.type === 'high' ? 'above' : 'below'} ${formatNumber(crossing.type === 'high' ? alert.highThreshold : alert.lowThreshold, 'full')} GP at ${timeStr} (price: ${formatNumber(crossing.price, 'full')} GP)`
            );
            await deactivateAlert(alert.itemId, crossing.type, crossing.price, crossing.timestamp);
          } else {
            checkedItemIds.push(alert.itemId);
          }
        } catch (err) {
          console.error(`Error checking retroactive price for ${alert.itemName}:`, err);
          checkedItemIds.push(alert.itemId);
        }
      }

      if (checkedItemIds.length > 0) {
        await updateLastChecked(checkedItemIds);
      }
    };

    checkRetroactive();
  }, [alerts, addNotification, deactivateAlert, updateLastChecked]);

  // Live check — runs every time gePrices updates (every 60s)
  useEffect(() => {
    if (!gePrices || Object.keys(gePrices).length === 0) return;

    const activeAlerts = Object.values(alerts).filter(a => a.isActive);
    if (activeAlerts.length === 0) return;

    const checkedItemIds = [];

    for (const alert of activeAlerts) {
      if (triggeredRef.current.has(alert.itemId)) continue;

      const price = gePrices[alert.itemId];
      if (!price) continue;

      let triggered = null;

      if (alert.highThreshold && price.high != null && price.high >= alert.highThreshold) {
        triggered = { type: 'high', price: price.high };
      } else if (alert.lowThreshold && price.low != null && price.low <= alert.lowThreshold) {
        triggered = { type: 'low', price: price.low };
      }

      if (triggered) {
        triggeredRef.current.add(alert.itemId);
        const now = new Date().toISOString();

        addNotification(
          triggered.type === 'high' ? 'priceAlertHigh' : 'priceAlertLow',
          `${alert.itemName} went ${triggered.type === 'high' ? 'above' : 'below'} ${formatNumber(triggered.type === 'high' ? alert.highThreshold : alert.lowThreshold, 'full')} GP (current: ${formatNumber(triggered.price, 'full')} GP)`
        );
        deactivateAlert(alert.itemId, triggered.type, triggered.price, now);
      } else {
        checkedItemIds.push(alert.itemId);
      }
    }

    if (checkedItemIds.length > 0) {
      updateLastChecked(checkedItemIds);
    }
  }, [gePrices, alerts, addNotification, deactivateAlert, updateLastChecked]);
}
