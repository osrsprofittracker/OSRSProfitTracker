import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { playNotificationSound, playPresetPreview, SOUND_PRESETS } from '../../hooks/useNotifications';

function SettingTooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="setting-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <div className="tooltip setting-tooltip">{text}</div>}
    </span>
  );
}

function ProfitCheckbox({ profit, checked, onChange }) {
  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox-input"
      />
      <SettingTooltip text={profit.info}>
        <span style={{ fontSize: '0.875rem', flex: 1 }}>{profit.label}</span>
      </SettingTooltip>
    </label>
  );
}

function GeneralTab({
  numberFormat,
  onNumberFormatChange,
  visibleColumns,
  onVisibleColumnsChange,
  visibleProfits,
  onVisibleProfitsChange,
  showCategoryStats,
  onShowCategoryStatsChange,
  showUnrealisedProfitStats,
  onShowUnrealisedProfitStatsChange,
  showCategoryUnrealisedProfit,
  onShowCategoryUnrealisedProfitChange,
  onChangePassword
}) {
  const columns = [
    { key: 'status', label: 'Status', tooltip: "Shows item status: ⏰Timer (4H limit active), ✓OK (holding at desired stock), 🔒Hold (excess stock), 🔴Low (below desired stock)." },
    { key: 'avgBuy', label: 'Avg Buy' },
    { key: 'avgSell', label: 'Avg Sell' },
    { key: 'profit', label: 'Profit' },
    { key: 'desiredStock', label: 'Desired Stock', tooltip: 'The target quantity you want to hold. Used to calculate how much more to buy.' },
    { key: 'limit4h', label: '4H Limit' },
    { key: 'geHigh', label: 'GE High' },
    { key: 'geLow', label: 'GE Low' },
    { key: 'unrealizedProfit', label: 'Unrealized Profit', tooltip: 'Estimated profit if all current stock were sold now at the live GE high price, after 2% GE tax.' },
    { key: 'investmentStartDate', label: 'Investment Start Date' },
    { key: 'notes', label: 'Notes', tooltip: 'A free-text note you can attach to each item for personal reference.' },
    { key: 'membershipIcon', label: 'F2P / Members Icon (★)', tooltip: 'Shows a star icon (★) indicating whether the item is F2P or members-only.' }
  ];

  return (
    <>
      {/* Number Format */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Number Format
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onNumberFormatChange('compact')}
              className={`settings-format-btn ${numberFormat === 'compact' ? 'settings-format-btn-active' : 'settings-format-btn-inactive'}`}
            >
              Compact (100K, 1.5M)
            </button>
            <button
              onClick={() => onNumberFormatChange('full')}
              className={`settings-format-btn ${numberFormat === 'full' ? 'settings-format-btn-active' : 'settings-format-btn-inactive'}`}
            >
              Full (100,000, 1,500,000)
            </button>
          </div>
        </div>
      </div>

      {/* Columns + Profits Side by Side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Visible Columns */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Visible Columns
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {columns.map((col) => (
              <label
                key={col.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgb(51, 65, 85)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={(e) =>
                    onVisibleColumnsChange({ ...visibleColumns, [col.key]: e.target.checked })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>
                  {col.tooltip ? (
                    <SettingTooltip text={col.tooltip}>{col.label}</SettingTooltip>
                  ) : col.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Visible Profit Types */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Visible Profit Types
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              {
                key: 'dumpProfit',
                label: 'Dump Profit',
                info: 'Track profits from buying dumps on ge, like Omega Dumps OSRS or Flipping Utilities '
              },
              {
                key: 'referralProfit',
                label: 'Referral Profit',
                info: 'Track income from referrering to other sellers or getting reffered.'
              },
              {
                key: 'bondsProfit',
                label: 'Bonds Profit',
                info: 'Track profits from buying and selling OSRS bonds'
              },
            ].map((profit) => (
              <ProfitCheckbox
                key={profit.key}
                profit={profit}
                checked={visibleProfits?.[profit.key] !== false}
                onChange={(e) =>
                  onVisibleProfitsChange({ ...visibleProfits, [profit.key]: e.target.checked })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Display Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Stats Display
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showUnrealisedProfitStats}
            onChange={(e) => onShowUnrealisedProfitStatsChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <SettingTooltip text="Display total estimated unrealised profit in the top summary cards">
            <div style={{ fontSize: '0.875rem' }}>Show Unrealised Profit in Portfolio Stats</div>
          </SettingTooltip>
        </label>
      </div>

      {/* Category Statistics Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          Category Display Options
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showCategoryStats}
            onChange={(e) => onShowCategoryStatsChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <SettingTooltip text="Display stock status counts (⏰Timer, ✓OK, 🔒Hold, 🔴Low) next to category names">
            <div style={{ fontSize: '0.875rem' }}>Show Category Statistics</div>
          </SettingTooltip>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgb(51, 65, 85)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginTop: '0.5rem',
          }}
        >
          <input
            type="checkbox"
            checked={showCategoryUnrealisedProfit}
            onChange={(e) => onShowCategoryUnrealisedProfitChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <SettingTooltip text="Display estimated unrealised profit per category based on live GE high prices">
            <div style={{ fontSize: '0.875rem' }}>Show Unrealised Profit in Category Stats</div>
          </SettingTooltip>
        </label>
      </div>

      {/* Change Password Link */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        borderTop: '1px solid rgb(71, 85, 105)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <button
          type="button"
          onClick={onChangePassword}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgb(96, 165, 250)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline',
            padding: 0
          }}
          onMouseOver={(e) => e.target.style.color = 'rgb(147, 197, 253)'}
          onMouseOut={(e) => e.target.style.color = 'rgb(96, 165, 250)'}
        >
          Change Password
        </button>
      </div>
    </>
  );
}

function SoundPicker({ soundChoice, onChange }) {
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
              playPresetPreview(preset.id);
            }}
          >
            <span className="sound-picker-option-label">{preset.label}</span>
            <button
              type="button"
              className="sound-picker-play-btn"
              onClick={(e) => {
                e.stopPropagation();
                playPresetPreview(preset.id);
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

function NotificationTypeSettings({ typePrefs, onChange }) {
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
            />
          )}
        </>
      )}
    </div>
  );
}

const NOTIFICATION_TYPES = [
  { key: 'limitTimer', label: '4H Limit Timer', description: "Get notified when a stock's GE buy limit resets" },
  { key: 'altAccountTimer', label: 'Alt Account Timer', description: 'Get notified when your alt account timer is ready' },
  { key: 'milestones', label: 'Milestones', description: 'Get notified when you reach a profit milestone' },
  { key: 'osrsNews', label: 'OSRS News', description: 'Get notified when new OSRS blog posts are published' },
  { key: 'jmodReddit', label: 'Jmod Reddit', description: 'Get notified when a Jagex Moderator comments on r/2007scape' },
  { key: 'priceAlert', label: 'Price Alerts', description: 'Get notified when a tracked item crosses your price threshold' },
];

function NotificationsTab({ notificationPreferences, onNotificationTypeChange }) {
  const [selectedKey, setSelectedKey] = useState(NOTIFICATION_TYPES[0].key);

  const handleTypeChange = (key, updatedTypePrefs) => {
    onNotificationTypeChange(key, updatedTypePrefs);
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.key === selectedKey);
  const selectedPrefs = notificationPreferences[selectedKey];

  return (
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
        />
      </div>
    </div>
  );
}

export default function SettingsModal({
  numberFormat,
  onNumberFormatChange,
  visibleColumns,
  onVisibleColumnsChange,
  visibleProfits,
  onVisibleProfitsChange,
  showCategoryStats,
  onShowCategoryStatsChange,
  showUnrealisedProfitStats,
  onShowUnrealisedProfitStatsChange,
  showCategoryUnrealisedProfit,
  onShowCategoryUnrealisedProfitChange,
  notificationPreferences,
  onNotificationTypeChange,
  onCancel,
  onChangePassword
}) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="settings-modal-container">
      <h2 className="settings-modal-title">Settings</h2>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'settings-tab-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'notifications' ? 'settings-tab-active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-tab-content">
        {activeTab === 'general' && (
          <GeneralTab
            numberFormat={numberFormat}
            onNumberFormatChange={onNumberFormatChange}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={onVisibleColumnsChange}
            visibleProfits={visibleProfits}
            onVisibleProfitsChange={onVisibleProfitsChange}
            showCategoryStats={showCategoryStats}
            onShowCategoryStatsChange={onShowCategoryStatsChange}
            showUnrealisedProfitStats={showUnrealisedProfitStats}
            onShowUnrealisedProfitStatsChange={onShowUnrealisedProfitStatsChange}
            showCategoryUnrealisedProfit={showCategoryUnrealisedProfit}
            onShowCategoryUnrealisedProfitChange={onShowCategoryUnrealisedProfitChange}
            onChangePassword={onChangePassword}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab
            notificationPreferences={notificationPreferences}
            onNotificationTypeChange={onNotificationTypeChange}
          />
        )}
      </div>

      {/* Done Button */}
      <div className="settings-modal-footer">
        <button
          onClick={onCancel}
          className="settings-done-btn"
        >
          Done
        </button>
      </div>
    </div>
  );
}
