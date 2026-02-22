import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';
import './Notifications.css';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const { api } = useAuth();

  const load = () => {
    api('/notifications').then(r => r.json()).then(setItems);
    api('/notifications').then(r => r.json()).then(data => {
      setUnread(data.filter(n => !n.read).length);
    });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const markRead = (id) => {
    api(`/notifications/${id}/read`, { method: 'PATCH' }).then(() => load());
  };

  const markAllRead = () => {
    api('/notifications/read-all', { method: 'PATCH' }).then(() => load());
  };

  return (
    <div className="notifications">
      <button className="notify-btn" onClick={() => setOpen(o => !o)}>
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="notify-dropdown">
          <div className="notify-header">
            <span>Notifications</span>
            {unread > 0 && <button onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notify-list">
            {items.length === 0 ? (
              <div className="notify-empty">No notifications</div>
            ) : (
              items.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`notify-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="notify-message">{n.message}</div>
                  <div className="notify-time">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
