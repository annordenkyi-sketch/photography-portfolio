import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getCredentials, logout } from '../../services/authService.js'
import * as notificationsService from '../../services/notificationsService.js'
import * as bookingsService from '../../services/bookingsService.js'
import * as studioProfile from '../../services/studioProfileService.js'
import NotificationBellDropdown from './NotificationBellDropdown.jsx'
import NotificationToastHost from './NotificationToastHost.jsx'

/* --- Grouped navigation ------------------------------------------------- */
const NAV_SECTIONS = [
  { heading: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon }] },
  { heading: 'Work', items: [
    { to: '/admin/bookings', label: 'Bookings', icon: BookingsIcon },
    { to: '/admin/calendar', label: 'Calendar', icon: CalendarIcon },
  ] },
  { heading: 'Money', items: [{ to: '/admin/payments', label: 'Payments', icon: PaymentsIcon }] },
  { heading: 'Content', items: [{ to: '/admin/portfolio', label: 'Portfolio', icon: PortfolioIcon }] },
  { heading: 'Settings', items: [{ to: '/admin/settings', label: 'Settings', icon: SettingsIcon }] },
]

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/bookings': 'Bookings',
  '/admin/calendar': 'Calendar',
  '/admin/payments': 'Payments',
  '/admin/notifications': 'Notifications',
  '/admin/portfolio': 'Portfolio',
  '/admin/settings': 'Settings',
}

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function toIsoDate(d) { return d.toISOString().split('T')[0] }

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0) // bumps whenever notifications change
  const [profile, setProfile] = useState(() => studioProfile.getProfile())
  const profileRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin'

  // Keep sidebar brand in sync when the studio name is edited in Settings
  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Generate "shoot tomorrow" reminders once per session for confirmed
  // bookings whose date is tomorrow and that don't already have a reminder.
  useEffect(() => {
    try {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowIso = toIsoDate(startOfDay(tomorrow))
      const bookings = bookingsService.getAll()
        .filter((b) => b.date === tomorrowIso && b.status === 'confirmed')
      const existing = notificationsService.getAll()
      for (const b of bookings) {
        const already = existing.some(
          (n) => n.type === 'shoot_tomorrow' && n.targetId === b.id,
        )
        if (!already) {
          notificationsService.add({
            type: 'shoot_tomorrow',
            message: `Reminder: ${b.package} shoot with ${b.clientName} tomorrow at ${b.time}`,
            targetType: 'booking',
            targetId: b.id,
          })
        }
      }
    } catch { /* ignore seed/stub errors */ }
  }, [])

  // Close drawer/menus on route change
  useEffect(() => {
    setDrawerOpen(false)
    setProfileOpen(false)
    setBellOpen(false)
  }, [location.pathname])

  // Close profile dropdown on outside click / Escape
  useEffect(() => {
    if (!profileOpen) return
    function onDoc(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

  // Re-render whenever a notification is added anywhere (so the bell count
  // + dropdown stay in sync without manual refresh).
  useEffect(() => {
    function onChange() { setTick((t) => t + 1) }
    window.addEventListener(notificationsService.ADD_EVENT_NAME, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(notificationsService.ADD_EVENT_NAME, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  function openNotification(n) {
    notificationsService.markRead(n.id)
    setBellOpen(false)
    setTick((t) => t + 1)
    if (n.targetType === 'booking' && n.targetId) {
      navigate(`/admin/bookings?open=${n.targetId}`)
    } else if (n.targetType === 'payment' && n.targetId) {
      navigate(`/admin/payments?open=${n.targetId}`)
    } else {
      navigate('/admin/notifications')
    }
  }

  function markAllRead() {
    notificationsService.markAllRead()
    setTick((t) => t + 1)
  }

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const creds = getCredentials()
  const initial = (creds.email || '?').charAt(0).toUpperCase()
  const notifications = (() => {
    try { return notificationsService.getAll() } catch { return [] }
  })()
  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${drawerOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link to="/admin/dashboard" className="admin-brand-link">
            <span className="admin-brand-eyebrow">{profile.name}</span>
            <span className="admin-brand-title">Admin</span>
          </Link>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} className="admin-nav-group">
              <p className="admin-nav-heading">{section.heading}</p>
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin/dashboard'}
                  className="admin-nav-link"
                >
                  <Icon />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-hamburger"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={drawerOpen}
          >
            <HamburgerIcon />
          </button>
          <h1 className="admin-topbar-title">{pageTitle}</h1>
          <form
            className="admin-topbar-search"
            onSubmit={(e) => e.preventDefault()}
            role="search"
          >
            <SearchIcon />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings, clients…"
              aria-label="Search bookings, clients"
            />
          </form>

          <div className="admin-bell-wrap">
            <button
              type="button"
              className="admin-topbar-icon-btn"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
              aria-haspopup="dialog"
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((v) => !v)}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="admin-topbar-badge" aria-hidden="true">{unreadCount}</span>
              )}
            </button>
            {bellOpen && (
              <NotificationBellDropdown
                notifications={notifications}
                onOpenNotification={openNotification}
                onMarkAllRead={markAllRead}
                onClose={() => setBellOpen(false)}
              />
            )}
          </div>

          <div className="admin-profile" ref={profileRef}>
            <button
              type="button"
              className="admin-profile-trigger"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <span className="admin-profile-avatar" aria-hidden="true">{initial}</span>
              <span className="admin-profile-caret" aria-hidden="true">▾</span>
            </button>
            {profileOpen && (
              <div className="admin-profile-menu" role="menu">
                <div className="admin-profile-menu-id">
                  <p className="admin-profile-menu-name">Demo photographer</p>
                  <p className="admin-profile-menu-email">{creds.email}</p>
                </div>
                <NavLink to="/admin/settings" className="admin-profile-menu-item" role="menuitem">
                  Settings
                </NavLink>
                <button
                  type="button"
                  className="admin-profile-menu-item admin-profile-menu-item--danger"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </div>

      <NotificationToastHost onOpen={openNotification} />
    </div>
  )
}

/* --- Inline SVG icons (unchanged from before) ------------------------- */

function DashboardIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>)
}
function BookingsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-2 1V6a2 2 0 0 1 2-2Z"/><path d="M8 10h6"/><path d="M8 14h4"/></svg>)
}
function CalendarIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>)
}
function PaymentsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 11h20"/><path d="M6 15h4"/></svg>)
}
function BellIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 16H6l1.5-2V10a4.5 4.5 0 0 1 9 0v4Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>)
}
function PortfolioIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-9 9"/></svg>)
}
function SettingsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.11.3.17.62.17.95"/></svg>)
}
function HamburgerIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>)
}
function SearchIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>)
}
