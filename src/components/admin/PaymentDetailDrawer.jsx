import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PaymentStatusBadge } from './StatusBadge.jsx'
import PaymentReceiptModal from './PaymentReceiptModal.jsx'
import * as bookingsService from '../../services/bookingsService.js'
import * as paymentsService from '../../services/paymentsService.js'

const METHOD_LABEL = { cash: 'Cash', bank: 'Bank transfer', momo: 'MoMo', card: 'Card' }

function formatCedis(n) {
  return `₵${Number(n || 0).toLocaleString('en-GH')}`
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(iso) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

// Side-panel detail. Slides in from the right on desktop, from the bottom
// as a sheet on mobile. Not a native <dialog> because we want fixed
// positioning + explicit animation.
export default function PaymentDetailDrawer({ paymentId, onClose }) {
  const payment = useMemo(
    () => paymentsService.getAll().find((p) => p.id === paymentId) || null,
    [paymentId],
  )
  const booking = payment ? bookingsService.getById(payment.bookingId) : null
  const clientPayments = useMemo(() => {
    if (!booking) return []
    return bookingsService
      .getAll()
      .filter((b) => b.clientName === booking.clientName)
      .flatMap((b) => paymentsService.getByBookingId(b.id).map((p) => ({ ...p, _booking: b })))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [booking])

  const [showReceipt, setShowReceipt] = useState(false)

  // Lock body scroll + Escape to close
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!payment) return null

  const paidForBooking = booking ? paymentsService.getBookingPaid(booking.id) : 0
  const balance = booking ? Math.max(0, booking.totalAmount - paidForBooking) : 0

  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="payment-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdd-title"
      >
        <header className="payment-drawer-header">
          <div>
            <p className="admin-modal-eyebrow">Payment · {payment.id}</p>
            <h2 id="pdd-title">
              {formatCedis(payment.amount)}
              <span className="muted"> · {METHOD_LABEL[payment.method] || payment.method}</span>
            </h2>
            <div className="payment-drawer-badge">
              <PaymentStatusBadge status={payment.status} />
            </div>
          </div>
          <button
            type="button"
            className="booking-modal-close"
            onClick={onClose}
            aria-label="Close payment details"
          >×</button>
        </header>

        <div className="payment-drawer-body">
          <section className="booking-detail-section">
            <h3>Payment</h3>
            <dl className="booking-detail-dl">
              <dt>Reference</dt><dd>{payment.id}</dd>
              <dt>Received</dt><dd>{formatDateTime(payment.date)}</dd>
              <dt>Method</dt><dd>{METHOD_LABEL[payment.method] || payment.method}</dd>
              {payment.note && (<><dt>Note</dt><dd>{payment.note}</dd></>)}
              {payment.refundReason && (
                <>
                  <dt>Refund reason</dt><dd>{payment.refundReason}</dd>
                  <dt>Refunded</dt><dd>{formatDateTime(payment.refundedAt)}</dd>
                </>
              )}
            </dl>
          </section>

          {booking && (
            <>
              <section className="booking-detail-section">
                <h3>Booking</h3>
                <dl className="booking-detail-dl">
                  <dt>Client</dt><dd>{booking.clientName}</dd>
                  <dt>Phone</dt><dd><a href={`tel:${booking.phone.replace(/\s+/g, '')}`}>{booking.phone}</a></dd>
                  <dt>Package</dt><dd>{booking.package}</dd>
                  <dt>Shoot date</dt><dd>{formatDate(booking.date)}</dd>
                  <dt>Location</dt><dd>{booking.location}</dd>
                </dl>
              </section>

              <section className="payment-summary">
                <h3>Balance on this booking</h3>
                <div className="payment-totals">
                  <div>
                    <span>Total</span>
                    <strong>{formatCedis(booking.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Paid</span>
                    <strong>{formatCedis(paidForBooking)}</strong>
                  </div>
                  <div className={balance > 0 ? 'balance-outstanding' : 'balance-cleared'}>
                    <span>Balance</span>
                    <strong>{formatCedis(balance)}</strong>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="pdd-section-title">
                  Full payment history — {booking.clientName}
                </h3>
                {clientPayments.length === 0 ? (
                  <p className="muted">No other payments on record.</p>
                ) : (
                  <ul className="payment-list">
                    {clientPayments.map((p) => (
                      <li key={p.id}>
                        <span className="payment-list-date">{formatDate(p.date)}</span>
                        <span className="payment-list-method">
                          {METHOD_LABEL[p.method] || p.method} · {p._booking?.package}
                        </span>
                        <span className="payment-list-amount">{formatCedis(p.amount)}</span>
                        <PaymentStatusBadge status={p.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="payment-drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => setShowReceipt(true)}>
            View receipt
          </button>
        </footer>

        {showReceipt && (
          <PaymentReceiptModal
            payment={payment}
            booking={booking}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </aside>
    </>,
    document.body,
  )
}
