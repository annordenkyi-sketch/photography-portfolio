import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as notificationsService from '../../services/notificationsService.js'
import NotificationItem from '../../components/admin/NotificationItem.jsx'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payments', label: 'Payments' },
]

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

function groupByDay(list) {
  const today = startOfDay(new Date())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const groups = { today: [], yesterday: [], earlier: [] }
  for (const n of list) {
    const d = startOfDay(new Date(n.createdAt))
    if (d.getTime() === today.getTime()) groups.today.push(n)
    else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(n)
    else groups.earlier.push(n)
  }
  return groups
}

export default function AdminNotifications() {
  const [version, setVersion] = useState(0)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const all = useMemo(() => notificationsService.getAll(), [version])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread':
        return all.filter((n) => !n.readAt)
      case 'bookings':
        return all.filter((n) => n.type === 'new_booking' || n.type === 'booking_cancelled' || n.type === 'shoot_tomorrow')
      case 'payments':
        return all.filter((n) => n.type === 'payment_received')
      case 'all':
      default:
        return all
    }
  }, [all, filter])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const unreadCount = all.filter((n) => !n.readAt).length

  function handleOpen(n) {
    notificationsService.markRead(n.id)
    if (n.targetType === 'booking' && n.targetId) {
      navigate(`/admin/bookings?open=${n.targetId}`)
    } else if (n.targetType === 'payment' && n.targetId) {
      navigate(`/admin/payments?open=${n.targetId}`)
    }
    setVersion((v) => v + 1)
  }

  function handleMarkAllRead() {
    notificationsService.markAllRead()
    setVersion((v) => v + 1)
  }

  return (
    <div className="admin-notifications-page">
      <header className="admin-page-heading">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount === 0
              ? "You're all caught up"
              : `${unreadCount} unread`}
            {filtered.length !== all.length ? ` · ${filtered.length} of ${all.length} shown` : ''}
          </p>
        </div>
        <div className="admin-page-heading-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
      </header>

      <nav className="notification-tabs" role="tablist" aria-label="Notification filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`notification-tab${filter === f.key ? ' is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <span className="notification-tab-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="notification-groups">
          {groups.today.length > 0 && (
            <section className="notification-group">
              <h2>Today</h2>
              <ul className="notification-list">
                {groups.today.map((n) => (
                  <li key={n.id}><NotificationItem notification={n} onOpen={handleOpen} /></li>
                ))}
              </ul>
            </section>
          )}

          {groups.yesterday.length > 0 && (
            <section className="notification-group">
              <h2>Yesterday</h2>
              <ul className="notification-list">
                {groups.yesterday.map((n) => (
                  <li key={n.id}><NotificationItem notification={n} onOpen={handleOpen} /></li>
                ))}
              </ul>
            </section>
          )}

          {groups.earlier.length > 0 && (
            <section className="notification-group">
              <h2>Earlier</h2>
              <ul className="notification-list">
                {groups.earlier.map((n) => (
                  <li key={n.id}><NotificationItem notification={n} onOpen={handleOpen} /></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter }) {
  const message = filter === 'unread'
    ? "You're all caught up"
    : filter === 'bookings'
      ? 'No booking notifications'
      : filter === 'payments'
        ? 'No payment notifications'
        : "You're all caught up"

  return (
    <div className="notification-empty">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true" className="notification-empty-art">
        <circle cx="44" cy="44" r="40" fill="var(--color-success-soft)" />
        <path
          d="M30 46l10 10 20-22"
          stroke="var(--color-success)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <h2>{message}</h2>
      <p>New activity from clients and the demo system will show up here.</p>
    </div>
  )
}
