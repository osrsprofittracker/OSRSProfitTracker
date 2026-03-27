import { useEffect, useRef, useState } from 'react';
import { Bell, Clock, Trophy, User, Check, X, CheckCheck, Trash2, Newspaper, ExternalLink } from 'lucide-react';

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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const wrapperRef = useRef(null);

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
              {notifications.length === 0 ? (
                <p className="notification-empty">No notifications</p>
              ) : (
                <div className="notification-list">
                  {notifications.map((n) => (
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
                      <button
                        className="notification-dismiss-btn"
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
        </div>
      )}
    </div>
  );
}
