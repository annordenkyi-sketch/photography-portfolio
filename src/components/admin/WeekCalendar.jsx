// Week view: slots × 7 days. Each cell shows status + (if booked/pending)
// the client name. Click a cell to pick that date & slot.
import { toIsoDate } from './MonthCalendar.jsx'
import * as slotsService from '../../services/slotsService.js'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekCalendar({ weekStart, onCellClick }) {
  const settings = slotsService.getSettings()
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Pre-compute each day's slot statuses so we can read them in the table
  const matrix = days.map((d) => ({
    date: d,
    iso: toIsoDate(d),
    statuses: slotsService.getDaySlotStatuses(toIsoDate(d)),
  }))

  return (
    <div className="week-calendar-wrap">
      <table className="week-calendar">
        <thead>
          <tr>
            <th className="week-calendar-corner" aria-label="Slot"></th>
            {days.map((d, i) => {
              const isToday = d.getTime() === today.getTime()
              return (
                <th key={i} className={`week-calendar-day${isToday ? ' is-today' : ''}`}>
                  <div className="week-calendar-day-name">{DAY_SHORT[d.getDay()]}</div>
                  <div className="week-calendar-day-num">{d.getDate()}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {settings.slots.map((slot, slotIdx) => (
            <tr key={slot.id}>
              <th className="week-calendar-slot-label">{slot.label}</th>
              {matrix.map((col) => {
                const cell = col.statuses[slotIdx]
                const booking = cell.bookings[0]
                return (
                  <td key={col.iso}>
                    <button
                      type="button"
                      className={`week-calendar-cell week-calendar-cell--${cell.status}`}
                      onClick={() => onCellClick?.(col.iso, slot.id)}
                    >
                      {booking ? (
                        <>
                          <span className="week-calendar-cell-name">{booking.clientName}</span>
                          <span className="week-calendar-cell-pkg">{booking.package}</span>
                        </>
                      ) : (
                        <span className="week-calendar-cell-label">
                          {cell.status === 'available' ? 'Available' : cell.status === 'blocked' ? 'Blocked' : ''}
                        </span>
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
