import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const NOTIFICATION_TYPES = ['limitTimer', 'altAccountTimer', 'milestones'];

const DEFAULT_TYPE_SETTINGS = {
  limitTimer: { enabled: false, browserPush: false, sound: false, soundChoice: 'chime', customSoundUri: null },
  altAccountTimer: { enabled: true, browserPush: false, sound: false, soundChoice: 'chime', customSoundUri: null },
  milestones: { enabled: true, browserPush: false, sound: false, soundChoice: 'chime', customSoundUri: null },
};

function rowToPrefs(row) {
  return {
    enabled: row.enabled,
    browserPush: row.browser_push,
    sound: row.sound,
    soundChoice: row.sound_choice,
    customSoundUri: row.custom_sound_uri ?? null,
  };
}

function prefsToRow(userId, type, prefs) {
  return {
    user_id: userId,
    type,
    enabled: prefs.enabled,
    browser_push: prefs.browserPush,
    sound: prefs.sound,
    sound_choice: prefs.soundChoice,
    custom_sound_uri: prefs.customSoundUri ?? null,
  };
}

export function useNotificationSettings(userId) {
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_TYPE_SETTINGS);
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
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching notification settings:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // Seed defaults
      const rows = NOTIFICATION_TYPES.map(type =>
        prefsToRow(userId, type, DEFAULT_TYPE_SETTINGS[type])
      );
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert(rows);

      if (insertError) {
        console.error('Error seeding notification settings:', insertError);
      }
      setLoading(false);
      return;
    }

    // Build map from rows
    const prefs = { ...DEFAULT_TYPE_SETTINGS };
    for (const row of data) {
      if (prefs[row.type] !== undefined) {
        prefs[row.type] = rowToPrefs(row);
      }
    }
    setNotificationPreferences(prefs);
    setLoading(false);
  };

  const updateNotificationPreference = useCallback(
    async (type, updatedPrefs) => {
      // Optimistic update
      setNotificationPreferences(prev => ({ ...prev, [type]: updatedPrefs }));

      const { error } = await supabase
        .from('notification_settings')
        .upsert(prefsToRow(userId, type, updatedPrefs), { onConflict: 'user_id,type' });

      if (error) {
        console.error('Error updating notification setting:', error);
        // Revert on error
        setNotificationPreferences(prev => ({ ...prev }));
      }
    },
    [userId]
  );

  return { notificationPreferences, updateNotificationPreference, loading };
}
