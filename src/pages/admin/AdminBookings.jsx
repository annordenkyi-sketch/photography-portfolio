import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as bookingsService from '../../services/bookingsService.js'
import { BookingStatusBadge } from '../../components/admin/StatusBadge.jsx'
import BookingDetailModal from '../../components/admin/BookingDetailModal.jsx'
import AddBookingModal from '../../components/admin/AddBookingModal.jsx'

const DEFAULT_FILTER = {
  status: 'all',
  dateFrom: '',
  dateTo: '',
  search: '',
}

const PAGE_SIZE = 10

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminBookings() {
  // `version` increments after mutations to force a re-read from the service.
  const [version, setVersion] = useState(0)
  const [filter, setFilter] = useState(DEFAULT_FILTER)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // Open detail if arriving with ?open=bk_xxx (e.g. from a notification click)
  useEffect(() => {
    const open = searchParams.get('open')
    if (open) {
      setSelectedId(open)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bookings = useMemo(() => bookingsService.getAll(), [version])

  const filtered = useMemo(() => {
    const q = filter.search.trim().toLowerCase()
    return bookings
      .filter((b) => {
        if (filter.status !== 'all' && b.status !== filter.status) return false
        if (filter.dateFrom && b.date < filter.dateFrom) return false
        if (filter.dateTo && b.date > filter.dateTo) return false
        if (q && !b.clientName.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [bookings, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 whenever the filter set changes.
  useEffect(() => {
    setPage(1)
  }, [filter])

  // Clamp page when the result set shrinks (e.g. after deletion).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  function handleChange(e) {
    const { name, value } = e.target
    setFilter((f) => ({ ...f, [name]: value }))
  }

  function resetFilters() {
    setFilter(DEFAULT_FILTER)
  }

  function showToast(message) {
    setToast(message)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3500)
  }

  function handleChanged(message) {
    setVersion((v) => v + 1)
    showToast(message)
  }

  return (
    <div className="admin-bookings-page">
      <header className="admin-page-heading">
        <div>
          <h1>Bookings</h1>
          <p>
            {filtered.length === 0
              ? 'No bookings match'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            {filtered.length !== bookings.length ? ` (${bookings.length} total)` : ''}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add booking
        </button>
      </header>

      <section className="admin-filters" aria-label="Filter bookings">
        <div className="admin-filter-field">
          <label htmlFor="filter-search">Search by name</label>
          <input
            type="search"
            id="filter-search"
            name="search"
            value={filter.search}
            onChange={handleChange}
            placeholder="Client name…"
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="filter-status">Status</label>
          <select id="filter-status" name="status" value={filter.status} onChange={handleChange}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="admin-filter-field">
          <label htmlFor="filter-from">From</label>
          <input
            type="date"
            id="filter-from"
            name="dateFrom"
            value={filter.dateFrom}
            onChange={handleChange}
          />
        </div>
        <div className="admin-filter-field">
          <label htmlFor="filter-to">To</label>
          <input
            type="date"
            id="filter-to"
            name="dateTo"
            value={filter.dateTo}
            onChange={handleChange}
          />
        </div>
        <button type="button" className="admin-filter-reset" onClick={resetFilters}>
          Clear
        </button>
      </section>

      {filtered.length === 0 ? (
        <p className="admin-empty">No bookings match your filters.</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Package</th>
                  <th>Date & time</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((b) => (
                  <tr key={b.id} onClick={() => setSelectedId(b.id)} tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedId(b.id)
                      }
                    }}
                  >
                    <td>
                      <div className="admin-cell-primary">{b.clientName}</div>
                      <div className="admin-cell-sub">{b.phone}</div>
                    </td>
                    <td>{b.package}</td>
                    <td>
                      <div>{formatDate(b.date)}</div>
                      <div className="admin-cell-sub">{b.time}</div>
                    </td>
                    <td>{b.location}</td>
                    <td><BookingStatusBadge status={b.status} /></td>
                    <td>
                      <span className="admin-row-chevron" aria-hidden="true">›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="admin-cards">
            {pageItems.map((b) => (
              <li key={b.id}>
                <button type="button" className="admin-card" onClick={() => setSelectedId(b.id)}>
                  <div className="admin-card-top">
                    <strong>{b.clientName}</strong>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="admin-card-row">
                    {b.package} · {formatDate(b.date)} · {b.time}
                  </div>
                  <div className="admin-card-row admin-cell-sub">{b.location}</div>
                  <div className="admin-card-row admin-cell-sub">{b.phone}</div>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Bookings pagination">
              <button
                type="button"
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span className="admin-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      {selectedId && (
        <BookingDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={handleChanged}
        />
      )}

      {showAdd && (
        <AddBookingModal
          onClose={() => setShowAdd(false)}
          onCreated={handleChanged}
        />
      )}

      {toast && (
        <div className="admin-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
