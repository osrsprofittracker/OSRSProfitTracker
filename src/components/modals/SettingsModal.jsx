import { useState } from 'react';
import GeneralTab from './settings/GeneralTab';
import NotificationsTab from './settings/NotificationsTab';
import '../../styles/settings-modal.css';

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
  notificationVolume,
  onNotificationVolumeChange,
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
            notificationVolume={notificationVolume}
            onNotificationVolumeChange={onNotificationVolumeChange}
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
