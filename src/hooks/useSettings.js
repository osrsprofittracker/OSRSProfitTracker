import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  limitTimer: false,
  altAccountTimer: true,
  milestones: true,
  browserPush: false,
  sound: false,
  soundChoice: 'chime',
};

const DEFAULT_VISIBLE_COLUMNS = {
  status: true,
  avgBuy: true,
  avgSell: true,
  profit: true,
  desiredStock: true,
  notes: true,
  limit4h: true,
  investmentStartDate: true,
  membershipIcon: true
};

const DEFAULT_VISIBLE_PROFITS = {
  dumpProfit: false,
  referralProfit: false,
  bondsProfit: true
};

export function useSettings(userId) {
  const [settings, setSettings] = useState({
    numberFormat: 'compact',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS,
    visibleProfits: DEFAULT_VISIBLE_PROFITS,
    altAccountTimer: null,
    showCategoryStats: false,
    showUnrealisedProfitStats: false,
    showCategoryUnrealisedProfit: true,
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    customNotificationSound: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await fetchSettings();
    };
    run();
    return () => { cancelled = true; };
  }, [userId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings({
        numberFormat: data.number_format || 'compact',
        visibleColumns: {
          ...DEFAULT_VISIBLE_COLUMNS,
          ...data.visible_columns,
          geHigh: data.visible_columns?.geHigh ?? true,
          geLow: data.visible_columns?.geLow ?? true,
          unrealizedProfit: data.visible_columns?.unrealizedProfit ?? true,
          investmentStartDate: data.visible_columns?.investmentStartDate ?? true,
          membershipIcon: data.visible_columns?.membershipIcon ?? true,
        },
        visibleProfits: data.visible_profits || DEFAULT_VISIBLE_PROFITS.bondsProfit,
        altAccountTimer: data.alt_account_timer,
        showCategoryStats: data.show_category_stats || false,
        showUnrealisedProfitStats: data.show_unrealised_profit_stats ?? false,
        showCategoryUnrealisedProfit: data.show_category_unrealised_profit ?? true,
        notificationPreferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...data.notification_preferences,
        },
        customNotificationSound: data.custom_notification_sound || null,
      });
    } else {
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert([{
          user_id: userId,
          number_format: 'compact',
          visible_columns: DEFAULT_VISIBLE_COLUMNS,
          visible_profits: DEFAULT_VISIBLE_PROFITS,
          alt_account_timer: null,
          show_category_stats: false
        }], { onConflict: 'user_id', ignoreDuplicates: true });

      if (insertError && insertError.code !== '23505') {
        console.error('Error creating initial settings:', insertError);
      }
    }
    setLoading(false);
  };

  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates };

    const dbData = {
      user_id: userId,
      number_format: newSettings.numberFormat,
      visible_columns: newSettings.visibleColumns,
      visible_profits: newSettings.visibleProfits,
      alt_account_timer: newSettings.altAccountTimer,
      show_category_stats: newSettings.showCategoryStats,
      show_unrealised_profit_stats: newSettings.showUnrealisedProfitStats,
      show_category_unrealised_profit: newSettings.showCategoryUnrealisedProfit,
      notification_preferences: newSettings.notificationPreferences,
      custom_notification_sound: newSettings.customNotificationSound,
    };

    let { error } = await supabase
      .from('user_settings')
      .upsert(dbData, { onConflict: 'user_id' });

    // If a new column doesn't exist yet, retry without it
    if (error) {
      const colsToTry = ['custom_notification_sound', 'notification_preferences'];
      let retryData = { ...dbData };
      for (const col of colsToTry) {
        if (error && error.message?.includes(col)) {
          delete retryData[col];
          const retry = await supabase
            .from('user_settings')
            .upsert(retryData, { onConflict: 'user_id' });
          error = retry.error;
        }
      }
    }

    if (error) {
      console.error('Error updating settings:', error);
      return false;
    } else {
      setSettings(newSettings);
      return true;
    }
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
