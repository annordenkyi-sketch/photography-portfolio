// =========================================================================
// Bookings service — frontend-only prototype.
//
// Reads from the mock seed and overlays any user changes stored in
// localStorage so demo state survives a page refresh. Replace the body of
// each function with real API calls when a backend is wired up — the
// public API (getAll/getById/update/add/remove/reset) stays the same.
// =========================================================================
import seedBookings from '../mock/bookings.js'

const STORAGE_KEY = 'demo:bookings'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seed
  }
  return seedBookings
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore: private mode / sandboxed
  }
}

export function getAll() {
  return load()
}

export function getById(id) {
  return load().find((b) => b.id === id) || null
}

export function update(id, patch) {
  const list = load().map((b) => (b.id === id ? { ...b, ...patch } : b))
  save(list)
  return list.find((b) => b.id === id) || null
}

export function add(booking) {
  const list = load()
  const id = booking.id || `bk_${Date.now().toString(36)}`
  const created = { ...booking, id, createdAt: booking.createdAt || new Date().toISOString() }
  const next = [created, ...list]
  save(next)
  return created
}

export function remove(id) {
  const list = load().filter((b) => b.id !== id)
  save(list)
}

export function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
