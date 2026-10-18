import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import NotificationIcon from './NotificationIcon.jsx'
import { formatRelativeTime } from '../../utils/formatRelativeTime.js'
import * as notificationsService from '../../services/notificationsService.js'
import { ADD_EVENT_NAME, STORAGE_KEY_NAME } from '../../services/notificationsService.js'

const SEEN_KEY = 'demo:notifications:lastSeen'

const TYPE_LABEL = {
  new_booking: 'New booking',
  payment_received: 'Payment received',
  booking_cancelled: 'Booking cancelled',
  shoot_tomorrow: 'Shoot reminder',
}

// Listens for new notifications dispatched anywhere (same tab via custom
// event, cross-tab via storage event) and shows a short toast in the corner.
export default function NotificationToastHost({ onOpen }) {
  const [toasts, setToasts] = useState([]) // [{ id, notification }]

  useEffect(() => {
    function pushToast(notification) {
      if (!notification) return
      const id = `${notification.id}-${Date.now()}`
      setToasts((t) => [...t, { id, notification }])
      // Auto-dismiss after 5s
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 5000)
    }

    function onCustom(e) {
      pushToast(e.detail)
    }

    function onStorage(e) {
      if (e.key !== STORAGE_KEY_NAME || !e.newValue) return
      try {
        const list = JSON.parse(e.newValue)
        // The newest unread notification is the one just added from the other tab
        const latest = list.find((n) => !n.readAt)
        if (latest) pushToast(latest)
      } catch { /* ignore */ }
    }

    window.addEventListener(ADD_EVENT_NAME, onCustom)
    window.addEventListener('storage', onStorage)

    // On mount, surface anything added since this tab last saw them so a
    // same-tab admin→public→admin navigation still gets a toast.
    try {
      const lastSeen = sessionStorage.getItem(SEEN_KEY) || ''
      const list = notificationsService.getAll()
      const unseen = list.filter((n) => !n.readAt && n.createdAt > lastSeen)
      for (const n of unseen) pushToast(n)
      if (list.length > 0) sessionStorage.setItem(SEEN_KEY, list[0].createdAt)
    } catch { /* ignore */ }

    return () => {
      window.removeEventListener(ADD_EVENT_NAME, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  function dismiss(id) {
    setToasts((t) => t.filter((x) => x.id !== id))
  }

  if (toasts.length === 0) return null

  return createPortal(
    <div className="notification-toast-stack" aria-live="polite">
      {toasts.map(({ id, notification }) => (
        <button
          key={id}
          type="button"
          className="notification-toast"
          onClick={() => { onOpen(notification); dismiss(id) }}
        >
          <NotificationIcon type={notification.type} size={20} />
          <div className="notification-toast-main">
            <p className="notification-toast-title">{TYPE_LABEL[notification.type] || 'Update'}</p>
            <p className="notification-toast-message">{notification.message}</p>
            <p className="notification-toast-time">{formatRelativeTime(notification.createdAt)}</p>
          </div>
          <span
            className="notification-toast-close"
            onClick={(e) => { e.stopPropagation(); dismiss(id) }}
            aria-label="Dismiss"
            role="button"
          >×</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}
