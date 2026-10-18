// =========================================================================
// Payments service — frontend-only prototype.
// Same localStorage-overlay pattern as bookingsService.
// =========================================================================
import seedPayments from '../mock/payments.js'

const STORAGE_KEY = 'demo:payments'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through
  }
  return seedPayments
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export function getAll() {
  return load()
}

export function getByBookingId(bookingId) {
  return load().filter((p) => p.bookingId === bookingId)
}

export function add(payment) {
  const list = load()
  const id = payment.id || `pay_${Date.now().toString(36)}`
  const created = { ...payment, id, date: payment.date || new Date().toISOString() }
  const next = [created, ...list]
  save(next)
  return created
}

export function update(id, patch) {
  const list = load().map((p) => (p.id === id ? { ...p, ...patch } : p))
  save(list)
  return list.find((p) => p.id === id) || null
}

/* --- Derived helpers --------------------------------------------------- */

// Sum of all active (not refunded) payments for a booking.
export function getBookingPaid(bookingId) {
  return getByBookingId(bookingId)
    .filter((p) => p.status === 'paid' || p.status === 'deposit_paid')
    .reduce((sum, p) => sum + p.amount, 0)
}

// Payment status for a booking, derived from total + what's been paid.
// Returns 'paid' | 'deposit_paid' | 'unpaid'.
export function deriveBookingPaymentStatus(bookingTotal, paid) {
  if (paid >= bookingTotal && bookingTotal > 0) return 'paid'
  if (paid > 0) return 'deposit_paid'
  return 'unpaid'
}

export function refund(id, reason) {
  return update(id, {
    status: 'refunded',
    refundReason: reason || '',
    refundedAt: new Date().toISOString(),
  })
}

export function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
