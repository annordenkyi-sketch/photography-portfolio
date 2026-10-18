import { useState } from 'react'

// Reusable month calendar grid.
// Used by the admin calendar (status-coded) and the public booking form
// (date picker with disabled dates). The parent controls the current
// view-month via `month`+`year` props; this component owns next/prev
// if `onMonthChange` isn't provided.
//
// Props:
//   month, year            — current view (0-indexed month)
//   selectedDate           — 'YYYY-MM-DD' or null
//   onSelectDate(dateIso)  — callback
//   onMonthChange({month, year})
//   dateMeta(dateIso, dateObj)  — returns { status, label, disabled }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function MonthCalendar({
  month,
  year,
  selectedDate,
  onSelectDate,
  onMonthChange,
  dateMeta,
  compact = false,
}) {
  const [internalMonth, setInternalMonth] = useState({ month, year })
  const current = onMonthChange ? { month, year } : internalMonth

  function changeMonth(delta) {
    const next = new Date(current.year, current.month + delta, 1)
    const payload = { month: next.getMonth(), year: next.getFullYear() }
    if (onMonthChange) onMonthChange(payload)
    else setInternalMonth(payload)
  }

  // Build a 6-row grid starting from Sunday on or before day 1
  const firstDay = new Date(current.year, current.month, 1)
  const startDate = new Date(firstDay)
  startDate.setDate(1 - firstDay.getDay())

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      week.push(date)
    }
    weeks.push(week)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className={`month-calendar${compact ? ' month-calendar--compact' : ''}`}>
      <header className="month-calendar-header">
        <button type="button" className="month-calendar-nav" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
        <h3>{MONTH_NAMES[current.month]} {current.year}</h3>
        <button type="button" className="month-calendar-nav" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
      </header>
      <div className="month-calendar-grid" role="grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="month-calendar-dayname" role="columnheader">{d}</div>
        ))}
        {weeks.flat().map((date) => {
          const iso = toIsoDate(date)
          const inMonth = date.getMonth() === current.month
          const meta = dateMeta ? dateMeta(iso, date) : {}
          const isSelected = iso === selectedDate
          const isToday = date.getTime() === today.getTime()
          const classes = [
            'month-calendar-cell',
            `month-calendar-cell--${meta.status || 'default'}`,
            inMonth ? '' : 'month-calendar-cell--outside',
            isSelected ? 'month-calendar-cell--selected' : '',
            isToday ? 'month-calendar-cell--today' : '',
            meta.disabled ? 'month-calendar-cell--disabled' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={iso}
              type="button"
              className={classes}
              role="gridcell"
              aria-selected={isSelected}
              aria-disabled={!!meta.disabled}
              disabled={!!meta.disabled}
              onClick={() => onSelectDate?.(iso, date)}
            >
              <span className="month-calendar-date">{date.getDate()}</span>
              {meta.label && <span className="month-calendar-label">{meta.label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
