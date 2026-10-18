// =========================================================================
// Slots service — frontend-only prototype.
//
// Combines the admin's slot settings, the day/slot block list, and the
// bookings data to compute whether a given date (or specific slot on a
// date) is available, pending, booked, or blocked.
//
// Slot statuses are DERIVED, not stored — booking status transitions
// automatically propagate to the calendar.
// =========================================================================
import defaultSettings from '../mock/slotSettings.js'
import defaultBlocks from '../mock/blockedDates.js'
import * as bookingsService from './bookingsService.js'

const SETTINGS_KEY = 'demo:slotSettings'
const BLOCKS_KEY = 'demo:blockedDates'

/* --- Settings persistence --------------------------------------------- */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through
  }
  return defaultSettings
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

/* --- Block list persistence ------------------------------------------- */
function loadBlocks() {
  try {
    const raw = localStorage.getItem(BLOCKS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through
  }
  return defaultBlocks
}

function saveBlocks(blocks) {
  try {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
  } catch {
    /* ignore */
  }
}

/* --- Public read API --------------------------------------------------- */
export function getSettings() {
  return loadSettings()
}

export function updateSettings(patch) {
  const next = { ...loadSettings(), ...patch }
  saveSettings(next)
  return next
}

export function getBlocks() {
  return loadBlocks()
}

export function isDayBlocked(date) {
  const b = loadBlocks().find((x) => x.date === date)
  return !!b && b.slotIds === null
}

export function getBlockedSlotIds(date) {
  const b = loadBlocks().find((x) => x.date === date)
  if (!b) return []
  if (b.slotIds === null) return 'all'
  return b.slotIds
}

export function isWorkingDay(date) {
  const settings = loadSettings()
  const day = new Date(date + 'T00:00:00').getDay()
  return settings.workingDays.includes(day)
}

export function getPackageSlotCount(packageName) {
  const settings = loadSettings()
  return settings.packageSlots[packageName] || 1
}

/* --- Mutations: blocking ---------------------------------------------- */
export function blockDay(date, reason = '') {
  const blocks = loadBlocks().filter((b) => b.date !== date)
  blocks.push({ date, slotIds: null, reason })
  saveBlocks(blocks)
}

export function unblockDay(date) {
  saveBlocks(loadBlocks().filter((b) => b.date !== date))
}

export function blockSlot(date, slotId) {
  const blocks = loadBlocks()
  const existing = blocks.find((b) => b.date === date)
  if (existing && existing.slotIds === null) return // whole day already blocked
  if (!existing) {
    blocks.push({ date, slotIds: [slotId] })
  } else if (!existing.slotIds.includes(slotId)) {
    existing.slotIds = [...existing.slotIds, slotId]
  }
  saveBlocks(blocks)
}

export function unblockSlot(date, slotId) {
  const blocks = loadBlocks()
  const existing = blocks.find((b) => b.date === date)
  if (!existing || existing.slotIds === null) return
  existing.slotIds = existing.slotIds.filter((s) => s !== slotId)
  if (existing.slotIds.length === 0) {
    saveBlocks(blocks.filter((b) => b.date !== date))
  } else {
    saveBlocks(blocks)
  }
}

/* --- Derived state ---------------------------------------------------- */

/**
 * Returns array of { slot, status, bookings[] } for every slot in settings
 * on the given date. Status is one of: available | pending | booked | blocked.
 */
export function getDaySlotStatuses(date) {
  const settings = loadSettings()
  const bookings = bookingsService.getAll()
  const dayBlocked = isDayBlocked(date)
  const blockedSlotIds = dayBlocked ? [] : getBlockedSlotIds(date) || []

  return settings.slots.map((slot) => {
    if (dayBlocked || (Array.isArray(blockedSlotIds) && blockedSlotIds.includes(slot.id))) {
      return { slot, status: 'blocked', bookings: [] }
    }
    const slotBookings = bookings.filter(
      (b) => b.date === date && Array.isArray(b.slotIds) && b.slotIds.includes(slot.id),
    )
    const confirmed = slotBookings.find((b) => b.status === 'confirmed' || b.status === 'completed')
    const pending = slotBookings.find((b) => b.status === 'pending')
    if (confirmed) return { slot, status: 'booked', bookings: [confirmed] }
    if (pending) return { slot, status: 'pending', bookings: [pending] }
    return { slot, status: 'available', bookings: [] }
  })
}

/**
 * Short summary used by the month calendar: counts and whether the day is
 * fully blocked / fully booked / partially available.
 */
export function getDayAvailability(date) {
  if (!isWorkingDay(date)) return { kind: 'offday', total: 0, available: 0 }
  const statuses = getDaySlotStatuses(date)
  const total = statuses.length
  const blockedCount = statuses.filter((s) => s.status === 'blocked').length
  const available = statuses.filter((s) => s.status === 'available').length
  if (blockedCount === total && total > 0) return { kind: 'blocked', total, available: 0 }
  if (available === 0) return { kind: 'full', total, available: 0 }
  if (available === total) return { kind: 'open', total, available }
  return { kind: 'partial', total, available }
}

/**
 * Returns the list of starting slots on a date that have `slotsNeeded`
 * consecutive available slots. Used by the public booking picker and the
 * admin reschedule picker.
 */
export function getAvailableRuns(date, slotsNeeded = 1) {
  if (!isWorkingDay(date) || isDayBlocked(date)) return []
  const statuses = getDaySlotStatuses(date)
  const runs = []
  for (let i = 0; i <= statuses.length - slotsNeeded; i++) {
    const chunk = statuses.slice(i, i + slotsNeeded)
    if (chunk.every((s) => s.status === 'available')) {
      runs.push({
        startSlot: chunk[0].slot,
        slotIds: chunk.map((s) => s.slot.id),
        label: slotsNeeded === 1
          ? chunk[0].slot.label
          : `${chunk[0].slot.start} – ${chunk[chunk.length - 1].slot.end}`,
      })
    }
  }
  return runs
}

export function isDateBookable(date, slotsNeeded = 1) {
  return getAvailableRuns(date, slotsNeeded).length > 0
}

export function reset() {
  try {
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(BLOCKS_KEY)
  } catch {
    /* ignore */
  }
}
