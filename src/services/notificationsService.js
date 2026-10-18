// =========================================================================
// Notifications service — frontend-only prototype.
// Same localStorage overlay pattern as the other admin services. Also
// dispatches a window event on `add` so the admin layout can show a toast
// and refresh its bell count without polling.
// =========================================================================
import seedNotifications from '../mock/notifications.js'

const STORAGE_KEY = 'demo:notifications'
const ADD_EVENT = 'perry:notification-added'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through
  }
  return seedNotifications
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function getAll() {
  return load().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getUnreadCount() {
  return load().filter((n) => !n.readAt).length
}

export function add(notification) {
  const list = load()
  const id = notification.id || `notif_${Date.now().toString(36)}`
  const created = {
    type: 'system',
    createdAt: new Date().toISOString(),
    readAt: null,
    ...notification,
    id,
  }
  save([created, ...list])
  // Same-tab subscribers (e.g. admin layout toast host) listen for this.
  try {
    window.dispatchEvent(new CustomEvent(ADD_EVENT, { detail: created }))
  } catch {
    /* non-browser */
  }
  return created
}

export function markRead(id) {
  const list = load().map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
  save(list)
}

export function markAllRead() {
  const now = new Date().toISOString()
  save(load().map((n) => (n.readAt ? n : { ...n, readAt: now })))
}

export function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export const ADD_EVENT_NAME = ADD_EVENT
export const STORAGE_KEY_NAME = STORAGE_KEY
