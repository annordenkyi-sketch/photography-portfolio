import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as bookingsService from '../../services/bookingsService.js'
import * as paymentsService from '../../services/paymentsService.js'
import { PaymentStatusBadge } from '../../components/admin/StatusBadge.jsx'
import PaymentDetailDrawer from '../../components/admin/PaymentDetailDrawer.jsx'

const DEFAULT_FILTER = { status: 'all', method: 'all', range: 'all', dateFrom: '', dateTo: '', search: '' }
const METHOD_LABEL = { cash: 'Cash', bank: 'Bank transfer', momo: 'MoMo', card: 'Card' }
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })

function formatCedis(n) {
  return `₵${Number(n || 0).toLocaleString('en-GH')}`
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

/* Compute from/to iso-dates for the preset range options */
function resolveRange(range) {
  const today = startOfDay(new Date())
  const toIso = (d) => d.toISOString().slice(0, 10)
  if (range === 'week') {
    const from = new Date(today); from.setDate(from.getDate() - 7)
    return { from: toIso(from), to: toIso(today) }
  }
  if (range === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { from: toIso(from), to: toIso(to) }
  }
  if (range === 'last_month') {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const to = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: toIso(from), to: toIso(to) }
  }
  return null
}

function toCsv(rows) {
  const header = [
    'Reference', 'Client', 'Phone', 'Package', 'Shoot date',
    'Amount (GH₵)', 'Method', 'Payment date', 'Status',
  ]
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      r.id, r.clientName, r.phone, r.package, r.shootDate,
      r.amount, METHOD_LABEL[r.method] || r.method,
      r.paymentDate, r.statusLabel,
    ].map(esc).join(','))
  }
  return lines.join('\n')
}

function download(text, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

const STATUS_LABEL = { paid: 'Paid', deposit_paid: 'Deposit paid', refunded: 'Refunded' }

export default function AdminPayments() {
  const [filter, setFilter] = useState(DEFAULT_FILTER)
  const [selectedId, setSelectedId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Open detail drawer if arriving with ?open=pay_xxx (e.g. from notifications)
  useEffect(() => {
    const open = searchParams.get('open')
    if (open) {
      setSelectedId(open)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load fresh on each mount — service is the single source of truth
  const bookings = useMemo(() => bookingsService.getAll(), [])
  const payments = useMemo(() => paymentsService.getAll(), [])
  const bookingById = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings])

  const effectiveRange = useMemo(() => {
    const preset = resolveRange(filter.range)
    if (preset) return preset
    return { from: filter.dateFrom, to: filter.dateTo }
  }, [filter.range, filter.dateFrom, filter.dateTo])

  // --- Summary stats ---------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date()
    const monthY = now.getFullYear(); const monthM = now.getMonth()

    const incomeThisMonth = payments
      .filter((p) => p.status !== 'refunded')
      .filter((p) => {
        const d = new Date(p.date)
        return d.getFullYear() === monthY && d.getMonth() === monthM
      })
      .reduce((s, p) => s + p.amount, 0)

    const paymentsThisMonthCount = payments
      .filter((p) => {
        const d = new Date(p.date)
        return d.getFullYear() === monthY && d.getMonth() === monthM
      }).length

    const totalAllTime = payments
      .filter((p) => p.status !== 'refunded')
      .reduce((s, p) => s + p.amount, 0)

    const paidByBooking = payments.reduce((acc, p) => {
      if (p.status === 'paid' || p.status === 'deposit_paid') {
        acc[p.bookingId] = (acc[p.bookingId] || 0) + p.amount
      }
      return acc
    }, {})
    const outstanding = bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected')
      .reduce((s, b) => s + Math.max(0, b.totalAmount - (paidByBooking[b.id] || 0)), 0)

    return { incomeThisMonth, totalAllTime, paymentsThisMonthCount, outstanding }
  }, [bookings, payments])

  // --- Filtered + enriched list ----------------------------------------
  const filtered = useMemo(() => {
    const q = filter.search.trim().toLowerCase()
    return payments
      .map((p) => {
        const b = bookingById[p.bookingId]
        return {
          ...p,
          clientName: b?.clientName || 'Unknown client',
          phone: b?.phone || '',
          package: b?.package || '',
          shootDate: b?.date || '',
          paymentDate: p.date,
          statusLabel: STATUS_LABEL[p.status] || p.status,
        }
      })
      .filter((p) => {
        if (filter.status !== 'all' && p.status !== filter.status) return false
        if (filter.method !== 'all' && p.method !== filter.method) return false
        if (effectiveRange.from && p.date.slice(0, 10) < effectiveRange.from) return false
        if (effectiveRange.to && p.date.slice(0, 10) > effectiveRange.to) return false
        if (q) {
          const haystack = `${p.clientName} ${p.phone} ${p.id}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [payments, bookingById, filter, effectiveRange])

  // --- Group by month (desc) ------------------------------------------
  const grouped = useMemo(() => {
    const map = new Map()
    for (const p of filtered) {
      const d = new Date(p.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map.has(key)) {
        map.set(key, { key, label: MONTH_FORMATTER.format(d), items: [], subtotal: 0 })
      }
      const bucket = map.get(key)
      bucket.items.push(p)
      if (p.status !== 'refunded') bucket.subtotal += p.amount
    }
    return [...map.values()] // already desc because filtered is desc
  }, [filtered])

  function handleFilter(e) {
    const { name, value } = e.target
    setFilter((f) => ({ ...f, [name]: value, ...(name === 'range' && value !== 'custom' ? { dateFrom: '', dateTo: '' } : {}) }))
  }

  function reset() { setFilter(DEFAULT_FILTER) }

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10)
    download(toCsv(filtered), `perry-studios-payments-${stamp}.csv`)
  }

  // Allow Escape to close the drawer handled inside the drawer; selection
  // state here just controls mount
  useEffect(() => {
    // Scroll body to top on filter change so user sees newest matches
  }, [filter])

  return (
    <div className="admin-payments-page admin-payments-history">
      <header className="admin-page-heading">
        <div>
          <h1>Payment history</h1>
          <p>
            {filtered.length === 0 ? 'No payments match' : `${filtered.length} payment${filtered.length === 1 ? '' : 's'} shown`}
            {filtered.length !== payments.length ? ` of ${payments.length}` : ''}
          </p>
        </div>
        <div className="admin-page-heading-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="dash-stats" aria-label="Payment summary">
        <StatCard label="Received this month" value={formatCedis(stats.incomeThisMonth)} tone="good" />
        <StatCard label="Received all time" value={formatCedis(stats.totalAllTime)} tone="muted" />
        <StatCard label="Payments this month" value={stats.paymentsThisMonthCount} tone="muted" />
        <StatCard label="Outstanding balances" value={formatCedis(stats.outstanding)} tone="warn" />
      </section>

      <section className="admin-filters" aria-label="Filter payment history">
        <div className="admin-filter-field">
          <label htmlFor="hist-search">Search</label>
          <input
            type="search"
            id="hist-search"
            name="search"
            value={filter.search}
            onChange={handleFilter}
            placeholder="Client, phone, or reference…"
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="hist-range">Date range</label>
          <select id="hist-range" name="range" value={filter.range} onChange={handleFilter}>
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="last_month">Last month</option>
            <option value="custom">Custom…</option>
          </select>
        </div>
        {filter.range === 'custom' && (
          <>
            <div className="admin-filter-field">
              <label htmlFor="hist-from">From</label>
              <input type="date" id="hist-from" name="dateFrom" value={filter.dateFrom} onChange={handleFilter} />
            </div>
            <div className="admin-filter-field">
              <label htmlFor="hist-to">To</label>
              <input type="date" id="hist-to" name="dateTo" value={filter.dateTo} onChange={handleFilter} />
            </div>
          </>
        )}
        <div className="admin-filter-field">
          <label htmlFor="hist-method">Method</label>
          <select id="hist-method" name="method" value={filter.method} onChange={handleFilter}>
            <option value="all">All methods</option>
            <option value="momo">MoMo</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="hist-status">Status</label>
          <select id="hist-status" name="status" value={filter.status} onChange={handleFilter}>
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="deposit_paid">Deposit paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <button type="button" className="admin-filter-reset" onClick={reset}>Clear</button>
      </section>

      {grouped.length === 0 ? (
        <p className="admin-empty">No payments match your filters.</p>
      ) : (
        <div className="payment-history-list">
          {grouped.map((group) => (
            <section key={group.key} className="payment-history-group">
              <header className="payment-history-group-head">
                <h2>{group.label}</h2>
                <p>
                  <span className="muted">Subtotal</span>{' '}
                  <strong>{formatCedis(group.subtotal)}</strong>
                  <span className="muted"> · {group.items.length} payment{group.items.length === 1 ? '' : 's'}</span>
                </p>
              </header>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((p) => (
                      <tr key={p.id} onClick={() => setSelectedId(p.id)} tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(p.id) }
                        }}
                      >
                        <td>{formatDate(p.date)}</td>
                        <td>
                          <div className="admin-cell-primary">{p.clientName}</div>
                          <div className="admin-cell-sub">{p.id}</div>
                        </td>
                        <td>
                          <div>{p.package || '—'}</div>
                          <div className="admin-cell-sub">{p.shootDate ? formatDate(p.shootDate) : ''}</div>
                        </td>
                        <td className="admin-cell-primary">{formatCedis(p.amount)}</td>
                        <td>{METHOD_LABEL[p.method] || p.method}</td>
                        <td><PaymentStatusBadge status={p.status} /></td>
                        <td><span className="admin-row-chevron" aria-hidden="true">›</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="admin-cards">
                {group.items.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="admin-card" onClick={() => setSelectedId(p.id)}>
                      <div className="admin-card-top">
                        <strong>{p.clientName}</strong>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <div className="admin-card-row">
                        {formatCedis(p.amount)} · {METHOD_LABEL[p.method] || p.method} · {formatDate(p.date)}
                      </div>
                      <div className="admin-card-row admin-cell-sub">
                        {p.package}{p.shootDate ? ` · shoot ${formatDate(p.shootDate)}` : ''} · {p.id}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selectedId && (
        <PaymentDetailDrawer
          paymentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
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
