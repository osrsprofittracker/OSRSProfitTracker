import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_VISIBLE_COLUMNS = {
  status: true,
  avgBuy: true,
  avgSell: true,
  profit: true,
  desiredStock: true,
  notes: true,
  limit4h: true
};

const DEFAULT_VISIBLE_PROFITS = {
  dumpProfit: false,
  referralProfit: false,
  bondsProfit: true
};

export function useSettings(userId) {
  const [settings, setSettings] = useState({
    theme: 'dark',
    numberFormat: 'compact',
    visibleColumns: DEFAULT_VISIBLE_COLUMNS,
    visibleProfits: DEFAULT_VISIBLE_PROFITS,
    altAccountTimer: null,
    showCategoryStats: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchSettings();
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
        theme: data.theme || 'dark',
        numberFormat: data.number_format || 'compact',
        visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS, ...data.visible_columns },
        visibleProfits: data.visible_profits || DEFAULT_VISIBLE_PROFITS.bondsProfit,
        altAccountTimer: data.alt_account_timer,
        showCategoryStats: data.show_category_stats || false
      });
    } else {
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert([{
          user_id: userId,
          theme: 'dark',
          number_format: 'compact',
          visible_columns: DEFAULT_VISIBLE_COLUMNS,
          visible_profits: DEFAULT_VISIBLE_PROFITS,
          alt_account_timer: null,
          show_category_stats: false
        }]);

      if (insertError) {
        console.error('Error creating initial settings:', insertError);
      }
    }
    setLoading(false);
  };

  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates };

    const dbData = {
      user_id: userId,
      theme: newSettings.theme,
      number_format: newSettings.numberFormat,
      visible_columns: newSettings.visibleColumns,
      visible_profits: newSettings.visibleProfits,
      alt_account_timer: newSettings.altAccountTimer,
      show_category_stats: newSettings.showCategoryStats
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(dbData, {
        onConflict: 'user_id'
      });

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