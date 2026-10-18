import { useMemo, useState } from 'react'
import AdminModal from './AdminModal.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import { BookingStatusBadge, PaymentStatusBadge } from './StatusBadge.jsx'
import * as bookingsService from '../../services/bookingsService.js'
import * as paymentsService from '../../services/paymentsService.js'
import * as slotsService from '../../services/slotsService.js'
import * as notificationsService from '../../services/notificationsService.js'

function shortDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const METHOD_LABEL = {
  momo: 'MoMo',
  card: 'Card',
  cash: 'Cash',
  bank: 'Bank transfer',
}

function formatCedis(n) {
  return `₵${n.toLocaleString('en-GH')}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPaymentDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function slotLabelFor(slotIds) {
  if (!Array.isArray(slotIds) || slotIds.length === 0) return null
  const all = slotsService.getSettings().slots
  const chunk = all.filter((s) => slotIds.includes(s.id))
  if (chunk.length === 0) return null
  if (chunk.length === 1) return chunk[0].label
  return `${chunk[0].start} – ${chunk[chunk.length - 1].end} (${chunk.length} slots)`
}

export default function BookingDetailModal({ id, onClose, onChanged }) {
  const booking = bookingsService.getById(id)
  const payments = booking ? paymentsService.getByBookingId(id) : []
  const [action, setAction] = useState(null) // null | 'reject' | 'reschedule' | 'cancel'
  const [rejectReason, setRejectReason] = useState('')
  const [newDate, setNewDate] = useState(booking?.date || '')
  const [newSlotIds, setNewSlotIds] = useState([])
  const [monthView, setMonthView] = useState(() => {
    const base = booking?.date ? new Date(booking.date + 'T00:00:00') : new Date()
    return { month: base.getMonth(), year: base.getFullYear() }
  })

  const slotsNeeded = booking ? slotsService.getPackageSlotCount(booking.package) : 1
  const rescheduleRuns = useMemo(() => {
    if (!newDate || !booking) return []
    // When looking at the SAME date as current booking, the current slots show
    // as "pending/booked" against themselves. Temporarily free them in the lookup.
    return slotsService.getAvailableRuns(newDate, slotsNeeded).filter((run) => {
      if (newDate !== booking.date) return true
      // Allow the booking to pick its own current slots back
      return true
    })
  }, [newDate, slotsNeeded, booking])

  const rescheduleDateMeta = useMemo(() => {
    return (iso) => {
      const avail = slotsService.getDayAvailability(iso)
      if (avail.kind === 'offday') return { status: 'offday', label: 'Off', disabled: true }
      if (avail.kind === 'blocked') return { status: 'blocked', label: 'Blocked', disabled: true }
      // On the booking's current date, free its own slots conceptually
      const canFit = slotsService.getAvailableRuns(iso, slotsNeeded).length > 0 || iso === booking?.date
      if (!canFit) return { status: 'full', label: 'Full', disabled: true }
      return { status: avail.kind, label: `${avail.available}/${avail.total}` }
    }
  }, [slotsNeeded, booking])

  if (!booking) {
    return (
      <AdminModal onClose={onClose} labelledBy="booking-missing-title">
        <div className="admin-modal-panel">
          <h2 id="booking-missing-title">Booking not found</h2>
          <p>This booking no longer exists.</p>
          <div className="admin-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </AdminModal>
    )
  }

  const paidTotal = payments
    .filter((p) => p.status === 'paid' || p.status === 'deposit_paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const balance = Math.max(0, booking.totalAmount - paidTotal)

  const canAccept = booking.status === 'pending'
  const canReject = booking.status === 'pending'
  const canReschedule = booking.status === 'pending' || booking.status === 'confirmed'
  const canComplete = booking.status === 'confirmed'
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

  function finish(message) {
    onChanged(message)
    onClose()
  }

  function handleAccept() {
    bookingsService.update(id, { status: 'confirmed' })
    finish(`Accepted ${booking.clientName}'s booking.`)
  }

  function handleReject(e) {
    e.preventDefault()
    const reason = rejectReason.trim()
    if (!reason) return
    bookingsService.update(id, { status: 'rejected', rejectionReason: reason })
    finish(`Rejected ${booking.clientName}'s booking.`)
  }

  function handleReschedule(e) {
    e.preventDefault()
    if (!newDate || newSlotIds.length === 0) return
    const slot = slotsService.getSettings().slots.find((s) => s.id === newSlotIds[0])
    bookingsService.update(id, {
      date: newDate,
      slotIds: newSlotIds,
      time: slot?.start || booking.time,
    })
    finish(`Rescheduled ${booking.clientName}'s booking to ${formatDate(newDate)} (${slot?.label || ''}).`)
  }

  function handleCancel() {
    bookingsService.update(id, { status: 'cancelled' })
    try {
      notificationsService.add({
        type: 'booking_cancelled',
        message: `${booking.clientName} cancelled their ${booking.package} shoot on ${shortDate(booking.date)}`,
        targetType: 'booking',
        targetId: booking.id,
      })
    } catch { /* ignore */ }
    finish(`Cancelled ${booking.clientName}'s booking.`)
  }

  function handleComplete() {
    bookingsService.update(id, { status: 'completed' })
    finish(`Marked ${booking.clientName}'s booking as completed.`)
  }

  return (
    <AdminModal onClose={onClose} labelledBy="booking-detail-title" size="wide">
      <div className="admin-modal-panel">
        <header className="admin-modal-header">
          <div>
            <p className="admin-modal-eyebrow">Booking · {booking.id}</p>
            <h2 id="booking-detail-title">{booking.clientName}</h2>
            <div className="admin-modal-subhead">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
          <button type="button" className="booking-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {!action && (
          <>
            <div className="booking-detail-grid">
              <section className="booking-detail-section">
                <h3>Contact</h3>
                <dl className="booking-detail-dl">
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${booking.phone.replace(/\s+/g, '')}`}>{booking.phone}</a>
                  </dd>
                  <dt>Email</dt>
                  <dd>
                    {booking.email ? (
                      <a href={`mailto:${booking.email}`}>{booking.email}</a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </dd>
                </dl>
              </section>

              <section className="booking-detail-section">
                <h3>Shoot</h3>
                <dl className="booking-detail-dl">
                  <dt>Package</dt>
                  <dd>{booking.package}</dd>
                  <dt>Date</dt>
                  <dd>{formatDate(booking.date)}</dd>
                  <dt>Slot</dt>
                  <dd>{slotLabelFor(booking.slotIds) || booking.time}</dd>
                  <dt>Location</dt>
                  <dd>{booking.location}</dd>
                </dl>
              </section>

              <section className="booking-detail-section booking-detail-section--full">
                <h3>Notes</h3>
                <p className={booking.notes ? '' : 'muted'}>{booking.notes || '—'}</p>
                {booking.rejectionReason && (
                  <>
                    <h3 className="booking-reject-heading">Rejection reason</h3>
                    <p>{booking.rejectionReason}</p>
                  </>
                )}
              </section>

              <section className="booking-detail-section booking-detail-section--full payment-summary">
                <h3>Payment summary</h3>
                <div className="payment-totals">
                  <div>
                    <span>Total</span>
                    <strong>{formatCedis(booking.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Paid</span>
                    <strong>{formatCedis(paidTotal)}</strong>
                  </div>
                  <div className={balance > 0 ? 'balance-outstanding' : 'balance-cleared'}>
                    <span>Balance</span>
                    <strong>{formatCedis(balance)}</strong>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <p className="muted">No payments recorded yet.</p>
                ) : (
                  <ul className="payment-list">
                    {payments.map((p) => (
                      <li key={p.id}>
                        <span className="payment-list-date">{formatPaymentDate(p.date)}</span>
                        <span className="payment-list-method">{METHOD_LABEL[p.method] || p.method}</span>
                        <span className="payment-list-amount">{formatCedis(p.amount)}</span>
                        <PaymentStatusBadge status={p.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <footer className="admin-modal-actions">
              {canAccept && (
                <button type="button" className="btn btn-primary" onClick={handleAccept}>
                  Accept
                </button>
              )}
              {canReject && (
                <button type="button" className="btn btn-secondary" onClick={() => setAction('reject')}>
                  Reject
                </button>
              )}
              {canReschedule && (
                <button type="button" className="btn btn-secondary" onClick={() => setAction('reschedule')}>
                  Reschedule
                </button>
              )}
              {canComplete && (
                <button type="button" className="btn btn-secondary" onClick={handleComplete}>
                  Mark complete
                </button>
              )}
              {canCancel && (
                <button type="button" className="btn btn-danger" onClick={() => setAction('cancel')}>
                  Cancel booking
                </button>
              )}
              {!canAccept && !canReject && !canReschedule && !canComplete && !canCancel && (
                <p className="muted">No actions available for this status.</p>
              )}
            </footer>
          </>
        )}

        {action === 'reject' && (
          <form className="booking-action-form" onSubmit={handleReject}>
            <h3>Reject booking</h3>
            <p className="muted">
              The client will be notified. Please add a short reason so they understand why.
            </p>
            <div className="form-field">
              <label htmlFor="reject-reason">Reason *</label>
              <textarea
                id="reject-reason"
                rows="4"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. Already fully booked that weekend."
                required
              />
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAction(null)}>
                Back
              </button>
              <button type="submit" className="btn btn-danger" disabled={!rejectReason.trim()}>
                Confirm rejection
              </button>
            </div>
          </form>
        )}

        {action === 'reschedule' && (
          <form className="booking-action-form" onSubmit={handleReschedule}>
            <h3>Reschedule booking</h3>
            <p className="muted">
              Pick a new date and slot. {booking.package} needs {slotsNeeded} consecutive slot{slotsNeeded === 1 ? '' : 's'}.
            </p>
            <MonthCalendar
              month={monthView.month}
              year={monthView.year}
              onMonthChange={setMonthView}
              selectedDate={newDate}
              onSelectDate={(iso) => {
                setNewDate(iso)
                setNewSlotIds([])
              }}
              dateMeta={rescheduleDateMeta}
              compact
            />
            {newDate && (
              <div className="slot-picker-wrap">
                <h4 className="slot-picker-label">Available on {formatDate(newDate)}</h4>
                {rescheduleRuns.length === 0 ? (
                  <p className="muted">No {slotsNeeded}-slot runs free on this date.</p>
                ) : (
                  <div className="slot-picker">
                    {rescheduleRuns.map((run) => {
                      const picked = newSlotIds.join(',') === run.slotIds.join(',')
                      return (
                        <button
                          key={run.startSlot.id}
                          type="button"
                          className={`slot-pick${picked ? ' is-picked' : ''}`}
                          onClick={() => setNewSlotIds(run.slotIds)}
                        >
                          {run.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAction(null)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={!newDate || newSlotIds.length === 0}>
                Save new slot
              </button>
            </div>
          </form>
        )}

        {action === 'cancel' && (
          <div className="booking-action-form">
            <h3>Cancel this booking?</h3>
            <p>
              This will mark <strong>{booking.clientName}</strong>'s booking as cancelled. The
              client will be notified.
            </p>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAction(null)}>
                No, keep it
              </button>
              <button type="button" className="btn btn-danger" onClick={handleCancel}>
                Yes, cancel booking
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  )
}
