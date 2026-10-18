import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import NotificationItem from './NotificationItem.jsx'

export default function NotificationBellDropdown({
  notifications,
  onOpenNotification,
  onMarkAllRead,
  onClose,
}) {
  const ref = useRef(null)
  const latest = notifications.slice(0, 5)
  const unreadCount = notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="notification-dropdown" ref={ref} role="dialog" aria-label="Notifications">
      <header className="notification-dropdown-head">
        <h3>Notifications</h3>
        <button
          type="button"
          className="notification-mark-all"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </header>

      {latest.length === 0 ? (
        <div className="notification-dropdown-empty">
          <p>You're all caught up.</p>
        </div>
      ) : (
        <ul className="notification-list notification-list--compact">
          {latest.map((n) => (
            <li key={n.id}>
              <NotificationItem notification={n} onOpen={onOpenNotification} compact />
            </li>
          ))}
        </ul>
      )}

      <footer className="notification-dropdown-foot">
        <Link to="/admin/notifications" onClick={onClose} className="notification-see-all">
          See all →
        </Link>
      </footer>
    </div>
  )
}
