import React, { useState } from 'react';

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  count?: number;
  notifications?: NotificationItem[];
  onOpen?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  notifications = [],
  onOpen,
}) => {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
    if (!open && onOpen) onOpen();
  };

  return (
    <div className="notif-wrapper">
      <button className="notif-icon-btn" onClick={handleToggle}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="notif-badge">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-dropdown">
            <div className="notif-header">
              <span className="notif-title">Notificaciones</span>
              <span className="notif-clear" onClick={() => setOpen(false)}>Cerrar</span>
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">No hay notificaciones pendientes</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                    <div className={`notif-dot${n.read ? ' muted' : ''}`} />
                    <div className="notif-content">
                      <p className="notif-text">{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
