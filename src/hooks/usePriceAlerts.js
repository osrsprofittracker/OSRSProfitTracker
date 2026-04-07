import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { mapRow } from '../utils/mapRow';

const ALERT_KEY_MAP = {
  id: 'id',
  itemId: 'item_id',
  itemName: 'item_name',
  highThreshold: 'high_threshold',
  lowThreshold: 'low_threshold',
  isActive: 'is_active',
  createdAt: 'created_at',
  lastCheckedAt: 'last_checked_at',
  triggeredAt: ['triggered_at', null],
  triggeredType: ['triggered_type', null],
  triggeredPrice: ['triggered_price', null],
};

const rowToAlert = (row) => mapRow(row, ALERT_KEY_MAP);

export function usePriceAlerts(userId) {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keyed by itemId — only active alerts (for bell icons + checker)
  const activeAlertsByItem = useMemo(() => {
    const map = {};
    for (const a of allAlerts) {
      if (a.isActive) map[a.itemId] = a;
    }
    return map;
  }, [allAlerts]);

  useEffect(() => {
    if (!userId) return;
    fetchAlerts();
  }, [userId]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching price alerts:', error);
      setAllAlerts([]);
    } else {
      setAllAlerts((data || []).map(rowToAlert));
    }
    setLoading(false);
  };

  const saveAlert = async (itemId, itemName, highThreshold, lowThreshold) => {
    const existing = activeAlertsByItem[itemId];

    if (existing) {
      // Update existing active alert
      const { error } = await supabase
        .from('price_alerts')
        .update({
          item_name: itemName,
          high_threshold: highThreshold || null,
          low_threshold: lowThreshold || null,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating price alert:', error);
        return false;
      }

      setAllAlerts(prev => prev.map(a =>
        a.id === existing.id
          ? { ...a, itemName, highThreshold: highThreshold || null, lowThreshold: lowThreshold || null, lastCheckedAt: new Date().toISOString() }
          : a
      ));
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_name: itemName,
          high_threshold: highThreshold || null,
          low_threshold: lowThreshold || null,
          is_active: true,
          dismissed: false,
          last_checked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating price alert:', error);
        return false;
      }

      setAllAlerts(prev => [rowToAlert(data), ...prev]);
    }
    return true;
  };

  const dismissAlert = async (alertId) => {
    const { error } = await supabase
      .from('price_alerts')
      .update({ dismissed: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error dismissing price alert:', error);
      return false;
    }

    setAllAlerts(prev => prev.filter(a => a.id !== alertId));
    return true;
  };

  const deactivateAlert = async (itemId, triggeredType, triggeredPrice, triggeredAt) => {
    const active = activeAlertsByItem[itemId];
    if (!active) return false;

    const { error } = await supabase
      .from('price_alerts')
      .update({
        is_active: false,
        triggered_at: triggeredAt,
        triggered_type: triggeredType,
        triggered_price: triggeredPrice,
      })
      .eq('id', active.id);

    if (error) {
      console.error('Error deactivating price alert:', error);
      return false;
    }

    setAllAlerts(prev => prev.map(a =>
      a.id === active.id
        ? { ...a, isActive: false, triggeredAt, triggeredType, triggeredPrice }
        : a
    ));
    return true;
  };

  const updateLastChecked = async (itemIds) => {
    const now = new Date().toISOString();
    const idsToUpdate = itemIds
      .map(itemId => activeAlertsByItem[itemId]?.id)
      .filter(Boolean);

    if (idsToUpdate.length === 0) return;

    const { error } = await supabase
      .from('price_alerts')
      .update({ last_checked_at: now })
      .in('id', idsToUpdate);

    if (error) {
      console.error('Error updating last_checked_at:', error);
      return;
    }

    setAllAlerts(prev => prev.map(a =>
      idsToUpdate.includes(a.id) ? { ...a, lastCheckedAt: now } : a
    ));
  };

  return {
    alerts: activeAlertsByItem,  // keyed by itemId, active only — for bell icons + checker
    allAlerts,                   // full array, non-dismissed — for Alerts tab
    loading,
    saveAlert,
    dismissAlert,
    deactivateAlert,
    updateLastChecked,
    refetch: fetchAlerts,
  };
}
