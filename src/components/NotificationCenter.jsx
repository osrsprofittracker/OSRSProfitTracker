import { useEffect, useRef, useState } from 'react';
import { Bell, Clock, Trophy, User, Check, X, CheckCheck, Trash2, Newspaper, ExternalLink, MessageSquare, Filter, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getTypeIcon(type) {
  switch (type) {
    case 'limitTimer':
      return <Clock size={16} />;
    case 'altAccountTimer':
      return <User size={16} />;
    case 'milestone':
      return <Trophy size={16} />;
    case 'osrsNews':
      return <Newspaper size={16} />;
    case 'jmodReddit':
      return <MessageSquare size={16} />;
    case 'priceAlert':
    case 'priceAlertHigh':
      return <TrendingUp size={16} />;
    case 'priceAlertLow':
      return <TrendingDown size={16} />;
    default:
      return <Bell size={16} />;
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'limitTimer':
      return 'var(--notification-timer-color, rgb(202, 138, 4))';
    case 'altAccountTimer':
      return 'var(--notification-alt-color, rgb(168, 85, 247))';
    case 'milestone':
      return 'var(--notification-milestone-color, rgb(34, 197, 94))';
    case 'osrsNews':
      return 'var(--notification-news-color, rgb(14, 165, 233))';
    case 'jmodReddit':
      return 'var(--notification-jmod-color, rgb(255, 149, 0))';
    case 'priceAlert':
    case 'priceAlertLow':
      return 'rgb(239, 68, 68)';
    case 'priceAlertHigh':
      return 'rgb(74, 222, 128)';
    default:
      return 'rgb(148, 163, 184)';
  }
}

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onNavigate,
  newsItems = [],
  jmodComments = [],
  newJmodCount = 0,
  priceAlerts = {},
  allPriceAlerts = [],
  geIconMap = {},
  gePrices = {},
  onEditAlert,
  onDismissAlert,
  onNewAlert,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [newsFilter, setNewsFilter] = useState('osrsNews');
  const [inboxFilter, setInboxFilter] = useState('all');
  const wrapperRef = useRef(null);

  const filteredNotifications = inboxFilter === 'all'
    ? notifications
    : inboxFilter === 'priceAlert'
      ? notifications.filter(n => n.type === 'priceAlert' || n.type === 'priceAlertHigh' || n.type === 'priceAlertLow')
      : notifications.filter(n => n.type === inboxFilter);

  const alertsList = allPriceAlerts;

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <div className="notification-tab-bar">
              <button
                className={`notification-tab ${activeTab === 'inbox' ? 'notification-tab-active' : ''}`}
                onClick={() => setActiveTab('inbox')}
              >
                Inbox
                {unreadCount > 0 && <span className="notification-tab-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              <button
                className={`notification-tab ${activeTab === 'news' ? 'notification-tab-active' : ''}`}
                onClick={() => setActiveTab('news')}
              >
                News
                {newJmodCount > 0 && <span className="notification-tab-badge">{newJmodCount > 99 ? '99+' : newJmodCount}</span>}
              </button>
              <button
                className={`notification-tab ${activeTab === 'alerts' ? 'notification-tab-active' : ''}`}
                onClick={() => setActiveTab('alerts')}
              >
                Alerts
              </button>
            </div>
            {activeTab === 'inbox' && notifications.length > 0 && (
              <div className="notification-header-actions">
                {unreadCount > 0 && (
                  <button
                    className="notification-action-btn"
                    onClick={onMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  className="notification-action-btn"
                  onClick={() => { onClearAll(); setIsOpen(false); }}
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {activeTab === 'inbox' && (
            <>
              {notifications.length > 0 && (
                <div className="notification-inbox-filters">
                  {[
                    { key: 'all', label: 'All', count: notifications.length },
                    { key: 'limitTimer', label: 'Timers' },
                    { key: 'altAccountTimer', label: 'Alt Timer' },
                    { key: 'milestone', label: 'Milestones' },
                    { key: 'osrsNews', label: 'News' },
                    { key: 'jmodReddit', label: 'Jmod' },
                    { key: 'priceAlert', label: 'Alerts' },
                  ].map(f => {
                    const count = f.count ?? (
                      f.key === 'priceAlert'
                        ? notifications.filter(n => n.type === 'priceAlert' || n.type === 'priceAlertHigh' || n.type === 'priceAlertLow').length
                        : notifications.filter(n => n.type === f.key).length
                    );
                    return (
                      <button
                        key={f.key}
                        className={`notification-inbox-filter-chip ${inboxFilter === f.key ? 'notification-inbox-filter-chip-active' : ''}`}
                        onClick={() => setInboxFilter(f.key)}
                      >
                        {f.label}
                        {count > 0 && <span className="notification-filter-chip-count">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {filteredNotifications.length === 0 ? (
                <p className="notification-empty">{notifications.length === 0 ? 'No notifications' : 'No notifications in this category'}</p>
              ) : (
                <div className="notification-list">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.read ? 'notification-item-read' : 'notification-item-unread'} ${n.navigationTarget ? 'notification-item-clickable' : ''}`}
                      onClick={() => {
                        if (!n.read) onMarkAsRead(n.id);
                        if (n.navigationTarget) {
                          onNavigate?.(n.navigationTarget);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div
                        className="notification-item-icon"
                        style={{ color: getTypeColor(n.type) }}
                      >
                        {getTypeIcon(n.type)}
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-message">{n.message}</div>
                        <div className="notification-item-time">{getTimeAgo(n.timestamp)}</div>
                      </div>
                      {!n.read && (
                        <button
                          className="notification-action-icon-btn"
                          onClick={(e) => { e.stopPropagation(); onMarkAsRead(n.id); }}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="notification-action-icon-btn"
                        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'news' && (
            <>
              <div className="notification-news-filter">
                <button
                  className={`notification-news-filter-btn ${newsFilter === 'osrsNews' ? 'notification-news-filter-btn-active' : ''}`}
                  onClick={() => setNewsFilter('osrsNews')}
                >
                  <Newspaper size={14} /> OSRS News
                </button>
                <button
                  className={`notification-news-filter-btn ${newsFilter === 'jmodReddit' ? 'notification-news-filter-btn-active' : ''}`}
                  onClick={() => setNewsFilter('jmodReddit')}
                >
                  <MessageSquare size={14} /> Jmod Reddit
                  {newJmodCount > 0 && <span className="notification-filter-badge">{newJmodCount}</span>}
                </button>
              </div>

              {newsFilter === 'osrsNews' && (
                <>
                  {newsItems.length === 0 ? (
                    <p className="notification-empty">No news yet</p>
                  ) : (
                    <div className="notification-news-list">
                      {newsItems.slice(0, 10).map((item) => (
                        <div key={item.guid} className="notification-news-item">
                          <h4 className="notification-news-title">{item.title}</h4>
                          <div className="notification-news-meta">{getTimeAgo(new Date(item.pubDate).getTime())}</div>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="notification-news-link"
                          >
                            Read more <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {newsFilter === 'jmodReddit' && (
                <>
                  {jmodComments.length === 0 ? (
                    <p className="notification-empty">No Jmod comments yet</p>
                  ) : (
                    <div className="notification-news-list">
                      {jmodComments.slice(0, 15).map((comment) => (
                        <a
                          key={comment.id}
                          href={`https://www.reddit.com${comment.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="notification-jmod-item"
                        >
                          <div className="notification-jmod-header">
                            <span className="notification-jmod-author">{comment.author}</span>
                            <span className="notification-news-meta">
                              {getTimeAgo(comment.created_utc * 1000)}
                            </span>
                          </div>
                          <div className="notification-jmod-context">{comment.link_title}</div>
                          <div className="notification-jmod-body">{comment.body}</div>
                          <span className="notification-news-link">
                            View on Reddit <ExternalLink size={12} />
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'alerts' && (
            <>
              {onNewAlert && (
                <div className="notification-alerts-header">
                  <button
                    className="notification-alerts-new-btn"
                    onClick={() => { onNewAlert(); setIsOpen(false); }}
                  >
                    + New Alert
                  </button>
                </div>
              )}
              {alertsList.length === 0 ? (
                <p className="notification-empty">No price alerts set</p>
              ) : (
                <div className="notification-alerts-list">
                  {alertsList
                    .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))
                    .map((alert) => {
                      const livePrice = gePrices[alert.itemId];
                      return (
                        <div key={alert.id} className="notification-alert-item">
                          {geIconMap[alert.itemId] && (
                            <img
                              src={geIconMap[alert.itemId]}
                              alt=""
                              className="notification-alert-icon"
                            />
                          )}
                          <div className="notification-alert-info">
                            <div className="notification-alert-name">{alert.itemName}</div>
                            <div className="notification-alert-thresholds">
                              {alert.highThreshold && (
                                <span className="notification-alert-threshold notification-alert-threshold-high">
                                  <TrendingUp size={10} />
                                  {formatNumber(alert.highThreshold, 'full')}
                                </span>
                              )}
                              {alert.lowThreshold && (
                                <span className="notification-alert-threshold notification-alert-threshold-low">
                                  <TrendingDown size={10} />
                                  {formatNumber(alert.lowThreshold, 'full')}
                                </span>
                              )}
                            </div>
                            {livePrice && alert.isActive && (
                              <div className="notification-alert-live-prices">
                                {livePrice.high != null && <span>High: {formatNumber(livePrice.high, 'full')}</span>}
                                {livePrice.low != null && <span>Low: {formatNumber(livePrice.low, 'full')}</span>}
                              </div>
                            )}
                            {alert.triggeredAt && (
                              <div className="notification-alert-triggered">
                                Triggered {getTimeAgo(new Date(alert.triggeredAt).getTime())} at {formatNumber(alert.triggeredPrice, 'full')} GP
                              </div>
                            )}
                          </div>
                          <span className={`notification-alert-status ${alert.isActive ? 'notification-alert-status-active' : 'notification-alert-status-triggered'}`}>
                            {alert.isActive ? 'Active' : 'Triggered'}
                          </span>
                          <div className="notification-alert-actions">
                            {alert.isActive && onEditAlert && (
                              <button
                                className="notification-alert-action-btn"
                                onClick={() => { onEditAlert(alert); setIsOpen(false); }}
                                title="Edit alert"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                            {onDismissAlert && (
                              <button
                                className="notification-alert-action-btn notification-alert-action-btn-delete"
                                onClick={() => onDismissAlert(alert.id)}
                                title="Dismiss"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
