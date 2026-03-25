import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { playNotificationSound, playPresetPreview, SOUND_PRESETS } from '../../hooks/useNotifications';

function ProfitCheckbox({ profit, checked, onChange }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="checkbox-input"
      />
      <span style={{ fontSize: '0.875rem', flex: 1 }}>{profit.label}</span>
      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="info-icon">i</span>
        {showTooltip && <div className="tooltip">{profit.info}</div>}
      </div>
    </label>
  );
}

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <label className="settings-notification-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="settings-notification-checkbox"
      />
      <div className="settings-notification-toggle-content">
        <div className="settings-notification-toggle-label">{label}</div>
        <div className="settings-notification-toggle-desc">{description}</div>
      </div>
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
    { key: 'status', label: 'Status' },
    { key: 'avgBuy', label: 'Avg Buy' },
    { key: 'avgSell', label: 'Avg Sell' },
    { key: 'profit', label: 'Profit' },
    { key: 'desiredStock', label: 'Desired Stock' },
    { key: 'limit4h', label: '4H Limit' },
    { key: 'geHigh', label: 'GE High' },
    { key: 'geLow', label: 'GE Low' },
    { key: 'unrealizedProfit', label: 'Unrealized Profit' },
    { key: 'investmentStartDate', label: 'Investment Start Date' },
    { key: 'notes', label: 'Notes' },
    { key: 'membershipIcon', label: 'F2P / Members Icon (★)' }
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
                <span style={{ fontSize: '0.875rem' }}>{col.label}</span>
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Show Unrealised Profit in Portfolio Stats</div>
            <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
              Display total estimated unrealised profit in the top summary cards
            </div>
          </div>
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Show Category Statistics</div>
            <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
              Display stock status counts (⏰Timer, ✓OK, 🔒Hold, 🔴Low) next to category names
            </div>
          </div>
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Show Unrealised Profit in Category Stats</div>
            <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
              Display estimated unrealised profit per category based on live GE high prices
            </div>
          </div>
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
  const [localChoice, setLocalChoice] = useState(soundChoice || 'chime');

  return (
    <div className="sound-picker">
      <div className="sound-picker-grid">
        {SOUND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`sound-picker-option ${localChoice === preset.id ? 'sound-picker-option-active' : ''}`}
            onClick={() => {
              setLocalChoice(preset.id);
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

function NotificationsTab({ notificationPreferences, onNotificationPreferencesChange, customNotificationSound, onCustomNotificationSoundChange }) {
  const handleChange = (key, value) => {
    onNotificationPreferencesChange({
      ...notificationPreferences,
      [key]: value,
    });
  };

  const handleSoundPickerChange = ({ soundChoice, customSoundUri }) => {
    // soundChoice goes in preferences JSONB, custom audio goes in separate column
    onNotificationPreferencesChange({
      ...notificationPreferences,
      soundChoice,
    });
    if (customSoundUri !== undefined) {
      onCustomNotificationSoundChange(customSoundUri);
    }
  };

  const handleBrowserPushChange = async (enabled) => {
    if (enabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    if (enabled && Notification.permission === 'denied') return;
    handleChange('browserPush', enabled);
  };

  return (
    <div className="settings-notifications-tab">
      <div className="settings-notification-section">
        <label className="settings-notification-section-label">
          Notification Types
        </label>
        <div className="settings-notification-list">
          <NotificationToggle
            label="4H Limit Timer"
            description="Get notified when a stock's GE buy limit resets"
            checked={notificationPreferences.limitTimer}
            onChange={(v) => handleChange('limitTimer', v)}
          />
          <NotificationToggle
            label="Alt Account Timer"
            description="Get notified when your alt account timer is ready"
            checked={notificationPreferences.altAccountTimer}
            onChange={(v) => handleChange('altAccountTimer', v)}
          />
          <NotificationToggle
            label="Milestones"
            description="Get notified when you reach a profit milestone"
            checked={notificationPreferences.milestones}
            onChange={(v) => handleChange('milestones', v)}
          />
        </div>
      </div>

      <div className="settings-notification-section">
        <label className="settings-notification-section-label">
          Delivery
        </label>
        <div className="settings-notification-list">
          <NotificationToggle
            label="Browser Notifications"
            description="Show system notifications even when the tab isn't focused"
            checked={notificationPreferences.browserPush}
            onChange={handleBrowserPushChange}
          />
          <NotificationToggle
            label="Sound Alerts"
            description="Play a sound when notifications arrive"
            checked={notificationPreferences.sound}
            onChange={(v) => handleChange('sound', v)}
          />
        </div>
      </div>

      {notificationPreferences.sound && (
        <div className="settings-notification-section">
          <label className="settings-notification-section-label">
            Notification Sound
          </label>
          <SoundPicker
            soundChoice={notificationPreferences.soundChoice}
            onChange={handleSoundPickerChange}
          />
        </div>
      )}
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
  onNotificationPreferencesChange,
  customNotificationSound,
  onCustomNotificationSoundChange,
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
            onNotificationPreferencesChange={onNotificationPreferencesChange}
            customNotificationSound={customNotificationSound}
            onCustomNotificationSoundChange={onCustomNotificationSoundChange}
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
