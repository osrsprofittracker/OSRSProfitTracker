import { useState, useCallback, useMemo, useRef } from 'react';

let notifCounter = 0;

const TYPE_PREF_KEY = {
  limitTimer: 'limitTimer',
  altAccountTimer: 'altAccountTimer',
  milestone: 'milestones',
  osrsNews: 'osrsNews',
};

// --- WAV generation helpers ---

function buildWav(sampleRate, samples) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function generateSamples(sampleRate, duration, fn) {
  const n = Math.floor(sampleRate * duration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    samples[i] = fn(i / sampleRate);
  }
  return samples;
}

// --- 5 preset sound generators ---

function presetChime() {
  const sr = 22050;
  const samples = generateSamples(sr, 0.4, (t) => {
    const freq = t < 0.18 ? 784 : 1047;
    const env = t < 0.18
      ? Math.max(0, 1 - t / 0.18 * 0.5)
      : Math.max(0, 1 - (t - 0.18) / 0.22);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.6;
  });
  return buildWav(sr, samples);
}

function presetPing() {
  const sr = 22050;
  const samples = generateSamples(sr, 0.25, (t) => {
    const env = Math.exp(-t * 12);
    return Math.sin(2 * Math.PI * 1200 * t) * env * 0.7;
  });
  return buildWav(sr, samples);
}

function presetTriple() {
  const sr = 22050;
  const samples = generateSamples(sr, 0.5, (t) => {
    let freq, env;
    if (t < 0.12) {
      freq = 523; env = Math.max(0, 1 - t / 0.12 * 0.6);
    } else if (t < 0.24) {
      freq = 659; env = Math.max(0, 1 - (t - 0.12) / 0.12 * 0.6);
    } else {
      freq = 784; env = Math.max(0, 1 - (t - 0.24) / 0.26);
    }
    return Math.sin(2 * Math.PI * freq * t) * env * 0.55;
  });
  return buildWav(sr, samples);
}

function presetSoft() {
  const sr = 22050;
  const samples = generateSamples(sr, 0.6, (t) => {
    const env = Math.sin(Math.PI * t / 0.6) * Math.exp(-t * 3);
    const tone = Math.sin(2 * Math.PI * 440 * t) * 0.5
      + Math.sin(2 * Math.PI * 880 * t) * 0.2;
    return tone * env;
  });
  return buildWav(sr, samples);
}

function presetAlert() {
  const sr = 22050;
  const samples = generateSamples(sr, 0.35, (t) => {
    const sweep = 600 + 800 * (1 - t / 0.35);
    const env = t < 0.05 ? t / 0.05 : Math.max(0, 1 - (t - 0.05) / 0.3);
    return Math.sin(2 * Math.PI * sweep * t) * env * 0.65;
  });
  return buildWav(sr, samples);
}

// --- Preset registry ---

export const SOUND_PRESETS = [
  { id: 'chime', label: 'Chime', generate: presetChime },
  { id: 'ping', label: 'Ping', generate: presetPing },
  { id: 'triple', label: 'Triple', generate: presetTriple },
  { id: 'soft', label: 'Soft', generate: presetSoft },
  { id: 'alert', label: 'Alert', generate: presetAlert },
];

const soundCache = {};

function getPresetUri(id) {
  if (!soundCache[id]) {
    const preset = SOUND_PRESETS.find(p => p.id === id);
    if (preset) {
      soundCache[id] = preset.generate();
    }
  }
  return soundCache[id] || null;
}

// --- Playback ---

export function playNotificationSound(soundChoice, customSoundUri) {
  try {
    let uri;
    if (soundChoice === 'custom' && customSoundUri) {
      uri = customSoundUri;
    } else {
      uri = getPresetUri(soundChoice || 'chime');
    }
    if (!uri) return;
    const audio = new Audio(uri);
    audio.volume = 0.7;
    return audio.play().catch((err) => {
      console.warn('Notification sound blocked:', err);
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

export function playPresetPreview(presetId) {
  const uri = getPresetUri(presetId);
  if (!uri) return;
  const audio = new Audio(uri);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

// --- Browser notifications ---

function sendBrowserNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification('OSRS Profit Tracker', { body: message });
  }
}

// --- Hook ---

export function useNotifications(preferences) {
  const [notifications, setNotifications] = useState([]);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((type, message, navigationTarget = null) => {
    const prefs = prefsRef.current;
    if (!prefs) return;

    const prefKey = TYPE_PREF_KEY[type];
    if (!prefKey) return;

    const typePrefs = prefs[prefKey];
    if (!typePrefs?.enabled) return;

    const notification = {
      id: ++notifCounter,
      type,
      message,
      timestamp: Date.now(),
      read: false,
      navigationTarget,
    };

    setNotifications(prev => [notification, ...prev]);

    if (typePrefs.sound) {
      playNotificationSound(typePrefs.soundChoice, typePrefs.customSoundUri);
    }

    if (typePrefs.browserPush) {
      sendBrowserNotification(message);
    }
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  };
}
