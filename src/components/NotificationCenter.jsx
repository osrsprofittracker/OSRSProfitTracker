import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationCenter({ notifications = [] }) {
  const [isOpen, setIsOpen] = useState(false);
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
        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">Notifications</div>
          {notifications.length === 0 ? (
            <p className="notification-empty">No notifications</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="notification-item">{n.message}</div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
