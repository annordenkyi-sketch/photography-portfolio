import { useMemo, useState } from 'react'
import MonthCalendar, { toIsoDate } from '../../components/admin/MonthCalendar.jsx'
import WeekCalendar from '../../components/admin/WeekCalendar.jsx'
import SlotSettingsModal from '../../components/admin/SlotSettingsModal.jsx'
import BookingDetailModal from '../../components/admin/BookingDetailModal.jsx'
import AddBookingModal from '../../components/admin/AddBookingModal.jsx'
import * as slotsService from '../../services/slotsService.js'

function formatHuman(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function AdminCalendar() {
  const today = new Date()
  const [view, setView] = useState('month') // 'month' | 'week'
  const [monthView, setMonthView] = useState({ month: today.getMonth(), year: today.getFullYear() })
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay()) // back to Sunday
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDate, setSelectedDate] = useState(toIsoDate(today))
  const [showSettings, setShowSettings] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState(null)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [version, setVersion] = useState(0)
  const [toast, setToast] = useState('')

  // The month calendar uses `version` as a cache-buster so edits re-render
  const dateMeta = useMemo(() => {
    return (iso) => {
      const avail = slotsService.getDayAvailability(iso)
      if (avail.kind === 'offday') {
        return { status: 'offday', label: 'Off', disabled: false }
      }
      if (avail.kind === 'blocked') {
        return { status: 'blocked', label: 'Blocked' }
      }
      if (avail.kind === 'full') {
        return { status: 'full', label: 'Full' }
      }
      return {
        status: avail.kind,
        label: `${avail.available}/${avail.total}`,
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  const slotsForSelected = useMemo(
    () => slotsService.getDaySlotStatuses(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, version],
  )
  const dayAvail = useMemo(
    () => slotsService.getDayAvailability(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, version],
  )

  function showToast(msg) {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3500)
  }

  function handleChanged(message) {
    setVersion((v) => v + 1)
    showToast(message)
  }

  function handleBlockDay() {
    if (!window.confirm(`Block ${formatHuman(selectedDate)} completely? Clients won't be able to pick this day.`)) return
    slotsService.blockDay(selectedDate)
    handleChanged(`Blocked ${formatHuman(selectedDate)}.`)
  }

  function handleUnblockDay() {
    slotsService.unblockDay(selectedDate)
    handleChanged(`Unblocked ${formatHuman(selectedDate)}.`)
  }

  function handleToggleSlot(slotId, currentStatus) {
    if (currentStatus === 'blocked') {
      slotsService.unblockSlot(selectedDate, slotId)
      handleChanged('Slot opened.')
    } else {
      slotsService.blockSlot(selectedDate, slotId)
      handleChanged('Slot blocked.')
    }
  }

  function changeWeek(delta) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  function handleWeekCellClick(iso, slotId) {
    setSelectedDate(iso)
    // Jump to that month if different
    const d = new Date(iso + 'T00:00:00')
    setMonthView({ month: d.getMonth(), year: d.getFullYear() })
    // If a booking occupies this slot, open its detail
    const statuses = slotsService.getDaySlotStatuses(iso)
    const match = statuses.find((s) => s.slot.id === slotId)
    if (match?.bookings[0]) {
      setSelectedBookingId(match.bookings[0].id)
    }
  }

  return (
    <div className="admin-calendar-page">
      <header className="admin-page-heading">
        <div>
          <h1>Calendar</h1>
          <p>Slot availability across the studio's working days.</p>
        </div>
        <div className="admin-calendar-controls">
          <div className="admin-view-toggle" role="tablist" aria-label="Calendar view">
            <button type="button" className={view === 'month' ? 'is-active' : ''} onClick={() => setView('month')}>Month</button>
            <button type="button" className={view === 'week' ? 'is-active' : ''} onClick={() => setView('week')}>Week</button>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            Slot settings
          </button>
        </div>
      </header>

      <div className="admin-calendar-grid">
        <div className="admin-calendar-main">
          {view === 'month' ? (
            <MonthCalendar
              month={monthView.month}
              year={monthView.year}
              onMonthChange={setMonthView}
              selectedDate={selectedDate}
              onSelectDate={(iso, dateObj) => {
                setSelectedDate(iso)
                if (dateObj.getMonth() !== monthView.month) {
                  setMonthView({ month: dateObj.getMonth(), year: dateObj.getFullYear() })
                }
              }}
              dateMeta={dateMeta}
            />
          ) : (
            <div className="week-view-wrap">
              <div className="week-view-nav">
                <button type="button" className="admin-pagination-btn" onClick={() => changeWeek(-1)}>← Prev week</button>
                <span className="admin-pagination-info">
                  Week of {new Date(weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button type="button" className="admin-pagination-btn" onClick={() => changeWeek(1)}>Next week →</button>
              </div>
              <WeekCalendar weekStart={weekStart} onCellClick={handleWeekCellClick} />
            </div>
          )}

          <ul className="admin-calendar-legend" aria-label="Legend">
            <li><span className="legend-dot legend-dot--open" /> Available</li>
            <li><span className="legend-dot legend-dot--partial" /> Partially booked</li>
            <li><span className="legend-dot legend-dot--pending" /> Has pending</li>
            <li><span className="legend-dot legend-dot--full" /> Fully booked</li>
            <li><span className="legend-dot legend-dot--blocked" /> Blocked</li>
            <li><span className="legend-dot legend-dot--offday" /> Off day</li>
          </ul>
        </div>

        <aside className="admin-day-panel">
          <header className="admin-day-panel-header">
            <h2>{formatHuman(selectedDate)}</h2>
            <p className="muted">
              {dayAvail.kind === 'offday' ? 'Studio is closed on this weekday.' :
                dayAvail.kind === 'blocked' ? 'This date is blocked.' :
                dayAvail.kind === 'full' ? 'No slots left.' :
                `${dayAvail.available} of ${dayAvail.total} slots available`}
            </p>
          </header>

          <div className="admin-day-panel-actions">
            {slotsService.isDayBlocked(selectedDate) ? (
              <button type="button" className="btn btn-secondary" onClick={handleUnblockDay}>
                Unblock day
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={handleBlockDay}>
                Block whole day
              </button>
            )}
            {dayAvail.kind !== 'offday' && dayAvail.kind !== 'blocked' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setAddDefaultDate(selectedDate)}
                disabled={dayAvail.available === 0}
              >
                + Add booking
              </button>
            )}
          </div>

          {dayAvail.kind !== 'offday' && (
            <ul className="admin-slot-list">
              {slotsForSelected.map(({ slot, status, bookings }) => {
                const booking = bookings[0]
                return (
                  <li key={slot.id} className={`admin-slot admin-slot--${status}`}>
                    <div className="admin-slot-main">
                      <span className="admin-slot-time">{slot.label}</span>
                      {booking && (
                        <div className="admin-slot-booking">
                          <strong>{booking.clientName}</strong>
                          <span className="muted">{booking.package} · {booking.phone}</span>
                        </div>
                      )}
                      {!booking && (
                        <span className={`status-badge status-badge--${status}`}>
                          {status === 'available' ? 'Available' : status === 'blocked' ? 'Blocked' : status}
                        </span>
                      )}
                    </div>
                    <div className="admin-slot-actions">
                      {booking ? (
                        <button type="button" className="admin-slot-link" onClick={() => setSelectedBookingId(booking.id)}>
                          Open
                        </button>
                      ) : status === 'available' ? (
                        <button type="button" className="admin-slot-link" onClick={() => handleToggleSlot(slot.id, status)}>
                          Block slot
                        </button>
                      ) : status === 'blocked' ? (
                        <button type="button" className="admin-slot-link" onClick={() => handleToggleSlot(slot.id, status)}>
                          Unblock
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>

      {showSettings && (
        <SlotSettingsModal onClose={() => setShowSettings(false)} onChanged={handleChanged} />
      )}

      {selectedBookingId && (
        <BookingDetailModal
          id={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onChanged={handleChanged}
        />
      )}

      {addDefaultDate && (
        <AddBookingModal
          defaultDate={addDefaultDate}
          onClose={() => setAddDefaultDate(null)}
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
