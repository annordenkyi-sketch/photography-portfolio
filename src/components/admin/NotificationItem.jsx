import NotificationIcon from './NotificationIcon.jsx'
import { formatRelativeTime } from '../../utils/formatRelativeTime.js'

// Shared row renderer for the bell dropdown and the full notifications page.
export default function NotificationItem({ notification, onOpen, compact = false }) {
  const isUnread = !notification.readAt
  const cls = [
    'notification-item',
    compact ? 'notification-item--compact' : '',
    isUnread ? 'is-unread' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={cls}
      onClick={() => onOpen(notification)}
      aria-label={notification.message}
    >
      <NotificationIcon type={notification.type} size={compact ? 18 : 20} />
      <span className="notification-item-main">
        <span className="notification-item-message">{notification.message}</span>
        <span className="notification-item-time">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
      {isUnread && <span className="notification-unread-dot" aria-label="Unread" />}
    </button>
  )
}
