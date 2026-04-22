import { useState } from 'react';
import { playPresetPreview, SOUND_PRESETS } from '../../../hooks/useNotifications';

function SoundPicker({ soundChoice, onChange, volume = 0.7 }) {
  return (
    <div className="sound-picker">
      <div className="sound-picker-grid">
        {SOUND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`sound-picker-option ${soundChoice === preset.id ? 'sound-picker-option-active' : ''}`}
            onClick={() => {
              onChange({ soundChoice: preset.id });
              playPresetPreview(preset.id, volume);
            }}
          >
            <span className="sound-picker-option-label">{preset.label}</span>
            <button
              type="button"
              className="sound-picker-play-btn"
              onClick={(e) => {
                e.stopPropagation();
                playPresetPreview(preset.id, volume);
              }}
              title={`Preview ${preset.label}`}
            >
              &#9654;
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationTypeSettings({ typePrefs, onChange, volume = 0.7 }) {
  const handleBrowserPushChange = async (enabled) => {
    if (enabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    if (enabled && Notification.permission === 'denied') return;
    onChange({ ...typePrefs, browserPush: enabled });
  };

  return (
    <div className="notif-detail-settings">
      <label className="notif-detail-row">
        <input
          type="checkbox"
          className="settings-notification-checkbox"
          checked={typePrefs.enabled}
          onChange={(e) => onChange({ ...typePrefs, enabled: e.target.checked })}
        />
        <div className="settings-notification-toggle-content">
          <div className="settings-notification-toggle-label">Enabled</div>
          <div className="settings-notification-toggle-desc">Receive this type of notification</div>
        </div>
      </label>

      {typePrefs.enabled && (
        <>
          <label className="notif-detail-row">
            <input
              type="checkbox"
              className="settings-notification-checkbox"
              checked={typePrefs.browserPush}
              onChange={(e) => handleBrowserPushChange(e.target.checked)}
            />
            <div className="settings-notification-toggle-content">
              <div className="settings-notification-toggle-label">Browser notifications</div>
              <div className="settings-notification-toggle-desc">Show system notification even when the tab isn't focused</div>
            </div>
          </label>
          <label className="notif-detail-row">
            <input
              type="checkbox"
              className="settings-notification-checkbox"
              checked={typePrefs.sound}
              onChange={(e) => onChange({ ...typePrefs, sound: e.target.checked })}
            />
            <div className="settings-notification-toggle-content">
              <div className="settings-notification-toggle-label">Sound alerts</div>
              <div className="settings-notification-toggle-desc">Play a sound when this notification fires</div>
            </div>
          </label>
          {typePrefs.sound && (
            <SoundPicker
              soundChoice={typePrefs.soundChoice}
              onChange={({ soundChoice }) => onChange({ ...typePrefs, soundChoice })}
              volume={volume}
            />
          )}
        </>
      )}
    </div>
  );
}

const NOTIFICATION_TYPES = [
  { key: 'limitTimer', label: '4H Limit Timer', description: "Get notified when an item's GE buy limit resets" },
  { key: 'altAccountTimer', label: 'Alt Account Timer', description: 'Get notified when your alt account timer is ready' },
  { key: 'milestones', label: 'Milestones', description: 'Get notified when you reach a profit milestone' },
  { key: 'osrsNews', label: 'OSRS News', description: 'Get notified when new OSRS blog posts are published' },
  { key: 'jmodReddit', label: 'Jmod Reddit', description: 'Get notified when a Jagex Moderator comments on r/2007scape' },
  { key: 'priceAlert', label: 'Price Alerts', description: 'Get notified when a tracked item crosses your price threshold' },
];

export default function NotificationsTab({ notificationPreferences, onNotificationTypeChange, notificationVolume, onNotificationVolumeChange }) {
  const [selectedKey, setSelectedKey] = useState(NOTIFICATION_TYPES[0].key);
  const volume = (notificationVolume ?? 70) / 100;

  const handleTypeChange = (key, updatedTypePrefs) => {
    onNotificationTypeChange(key, updatedTypePrefs);
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.key === selectedKey);
  const selectedPrefs = notificationPreferences[selectedKey];

  return (
    <>
      <div className="notif-volume-section">
        <div className="notif-volume-row">
          <span className="notif-volume-label">Volume</span>
          <input
            type="range"
            className="notif-volume-slider"
            min="0"
            max="100"
            value={notificationVolume ?? 70}
            onChange={(e) => onNotificationVolumeChange(Number(e.target.value))}
            onMouseUp={() => playPresetPreview('chime', (notificationVolume ?? 70) / 100)}
            onTouchEnd={() => playPresetPreview('chime', (notificationVolume ?? 70) / 100)}
          />
          <span className="notif-volume-value">{notificationVolume ?? 70}%</span>
        </div>
      </div>
      <div className="notif-settings-pane">
        <div className="notif-sidebar">
          {NOTIFICATION_TYPES.map((type) => {
            const enabled = notificationPreferences[type.key]?.enabled;
            return (
              <button
                key={type.key}
                type="button"
                className={`notif-sidebar-item ${selectedKey === type.key ? 'notif-sidebar-item-active' : ''}`}
                onClick={() => setSelectedKey(type.key)}
              >
                <span className={`notif-sidebar-dot ${enabled ? 'notif-sidebar-dot-on' : 'notif-sidebar-dot-off'}`} />
                <span className="notif-sidebar-label">{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="notif-detail">
          <div className="notif-detail-title">{selectedType.label}</div>
          <div className="notif-detail-desc">{selectedType.description}</div>
          <NotificationTypeSettings
            typePrefs={selectedPrefs}
            onChange={(updated) => handleTypeChange(selectedKey, updated)}
            volume={volume}
          />
        </div>
      </div>
    </>
  );
}
