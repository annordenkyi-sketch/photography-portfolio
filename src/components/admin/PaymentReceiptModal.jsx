import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as paymentsService from '../../services/paymentsService.js'
import * as studioProfile from '../../services/studioProfileService.js'

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

export default function PaymentReceiptModal({ payment, booking, onClose }) {
  const ref = useRef(null)
  const paidForBooking = booking ? paymentsService.getBookingPaid(booking.id) : 0
  const balance = booking ? Math.max(0, booking.totalAmount - paidForBooking) : 0
  const profile = studioProfile.getProfile()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleBackdrop(e) {
    if (e.target === ref.current) onClose()
  }

  function handlePrint() {
    window.print()
  }

  return createPortal(
    <div className="receipt-overlay" ref={ref} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="receipt-sheet">
        <div className="receipt-print-area">
          <header className="receipt-head">
            <h2>{profile.name}</h2>
            <p>Photography{profile.address ? ` · ${profile.address}` : ''}</p>
            {(profile.email || profile.phone) && (
              <p className="receipt-head-contact">
                {[profile.email, profile.phone].filter(Boolean).join(' · ')}
              </p>
            )}
          </header>

          <div className="receipt-meta">
            <div>
              <p className="receipt-meta-label">Receipt no.</p>
              <p className="receipt-meta-value">{payment.id}</p>
            </div>
            <div>
              <p className="receipt-meta-label">Issued</p>
              <p className="receipt-meta-value">{formatDateTime(payment.date)}</p>
            </div>
          </div>

          <section className="receipt-section">
            <h3>Billed to</h3>
            {booking ? (
              <>
                <p className="receipt-strong">{booking.clientName}</p>
                <p>{booking.phone}</p>
                {booking.email && <p>{booking.email}</p>}
              </>
            ) : (
              <p className="muted">Linked booking no longer available.</p>
            )}
          </section>

          <section className="receipt-section">
            <h3>Shoot</h3>
            {booking ? (
              <>
                <p><strong>{booking.package}</strong> · {formatDate(booking.date)}</p>
                <p>{booking.location}</p>
              </>
            ) : (
              <p className="muted">—</p>
            )}
          </section>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Method</th>
                <th className="receipt-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {booking?.package || 'Payment'} — {payment.status === 'refunded' ? 'REFUNDED' : payment.status === 'deposit_paid' ? 'Deposit' : 'Full payment'}
                  {payment.note && <div className="receipt-table-sub">{payment.note}</div>}
                </td>
                <td>{METHOD_LABEL[payment.method] || payment.method}</td>
                <td className="receipt-amount">{formatCedis(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2">Booking total</td>
                <td className="receipt-amount">{formatCedis(booking?.totalAmount || 0)}</td>
              </tr>
              <tr>
                <td colSpan="2">Paid to date</td>
                <td className="receipt-amount">{formatCedis(paidForBooking)}</td>
              </tr>
              <tr>
                <td colSpan="2"><strong>Balance remaining</strong></td>
                <td className="receipt-amount"><strong>{formatCedis(balance)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <footer className="receipt-foot">
            <p>Thank you for choosing {profile.name}.</p>
            <p className="muted">This receipt was generated electronically — no signature required.</p>
          </footer>
        </div>

        <div className="receipt-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>Print receipt</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
