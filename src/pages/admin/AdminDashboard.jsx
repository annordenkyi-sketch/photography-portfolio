import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as bookingsService from '../../services/bookingsService.js'
import * as paymentsService from '../../services/paymentsService.js'
import { PaymentStatusBadge } from '../../components/admin/StatusBadge.jsx'
import DashboardWelcome from '../../components/admin/DashboardWelcome.jsx'

const CURRENCY = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatCedis(n) {
  return `₵${CURRENCY.format(n)}`
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameYmd(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const METHOD_LABEL = {
  momo: 'MoMo',
  card: 'Card',
  cash: 'Cash',
  bank: 'Bank transfer',
}

export default function AdminDashboard() {
  const stats = useMemo(() => {
    const bookings = bookingsService.getAll()
    const payments = paymentsService.getAll()
    const today = startOfDay(new Date())
    const weekEnd = startOfDay(new Date())
    weekEnd.setDate(weekEnd.getDate() + 7)

    const pending = bookings.filter((b) => b.status === 'pending')

    const monthIncome = payments
      .filter((p) => {
        const d = new Date(p.date)
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          (p.status === 'paid' || p.status === 'deposit_paid')
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // Outstanding across active (not cancelled/rejected) bookings
    const paidByBooking = payments.reduce((acc, p) => {
      if (p.status === 'paid' || p.status === 'deposit_paid') {
        acc[p.bookingId] = (acc[p.bookingId] || 0) + p.amount
      }
      return acc
    }, {})
    const outstanding = bookings.reduce((sum, b) => {
      if (b.status === 'cancelled' || b.status === 'rejected') return sum
      const paid = paidByBooking[b.id] || 0
      return sum + Math.max(0, b.totalAmount - paid)
    }, 0)

    const todayShoots = bookings
      .filter((b) => (b.status === 'confirmed' || b.status === 'completed') && sameYmd(new Date(b.date), today))
      .sort((a, b) => a.time.localeCompare(b.time))

    const thisWeekShoots = bookings
      .filter((b) => {
        if (b.status !== 'confirmed' && b.status !== 'completed') return false
        const d = startOfDay(new Date(b.date))
        return d > today && d < weekEnd
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

    const recentPayments = [...payments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)

    const bookingById = Object.fromEntries(bookings.map((b) => [b.id, b]))

    return {
      pendingCount: pending.length,
      monthIncome,
      outstanding,
      todayShoots,
      thisWeekShoots,
      recentPayments,
      bookingById,
    }
  }, [])

  return (
    <div className="admin-dashboard">
      <DashboardWelcome />

      <section className="dash-stats" aria-label="At-a-glance stats">
        <StatCard label="Pending booking requests" value={stats.pendingCount} tone="warn" />
        <StatCard label="This month's income" value={formatCedis(stats.monthIncome)} tone="good" />
        <StatCard label="Outstanding balances" value={formatCedis(stats.outstanding)} tone="muted" />
      </section>

      <section className="dash-actions" aria-label="Quick actions">
        <Link to="/admin/bookings" className="btn btn-primary">Review pending bookings</Link>
        <Link to="/admin/portfolio" className="btn btn-secondary">Upload photos</Link>
      </section>

      <section className="dash-upcoming" aria-label="Upcoming shoots">
        <div className="dash-section-header">
          <h2>Upcoming shoots</h2>
        </div>
        <div className="dash-upcoming-grid">
          <ShootsColumn
            title="Today"
            emptyLabel="No shoots today."
            shoots={stats.todayShoots}
          />
          <ShootsColumn
            title="This week"
            emptyLabel="No more shoots this week."
            shoots={stats.thisWeekShoots}
          />
        </div>
      </section>

      <section className="dash-payments" aria-label="Recent payments">
        <div className="dash-section-header">
          <h2>Recent payments</h2>
          <Link to="/admin/payments" className="dash-link">View all →</Link>
        </div>
        {stats.recentPayments.length === 0 ? (
          <p className="dash-empty">No payments recorded yet.</p>
        ) : (
          <ul className="dash-payment-list">
            {stats.recentPayments.map((p) => {
              const booking = stats.bookingById[p.bookingId]
              return (
                <li key={p.id} className="dash-payment-row">
                  <div className="dash-payment-main">
                    <strong>{booking?.clientName || 'Unknown client'}</strong>
                    <span className="dash-payment-meta">
                      {booking?.package || '—'} · {METHOD_LABEL[p.method] || p.method} ·{' '}
                      {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="dash-payment-amount">
                    <strong>{formatCedis(p.amount)}</strong>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
    </article>
  )
}

function ShootsColumn({ title, shoots, emptyLabel }) {
  return (
    <div className="shoots-column">
      <h3>{title}</h3>
      {shoots.length === 0 ? (
        <p className="dash-empty">{emptyLabel}</p>
      ) : (
        <ul className="shoots-list">
          {shoots.map((b) => (
            <li key={b.id} className="shoot-card">
              <div className="shoot-row">
                <strong>{b.clientName}</strong>
                <span className="shoot-time">
                  {new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {b.time}
                </span>
              </div>
              <div className="shoot-row shoot-row--meta">
                <span>{b.package}</span>
                <span className="shoot-location">{b.location}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

