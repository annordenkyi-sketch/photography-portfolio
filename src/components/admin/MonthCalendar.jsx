import { useEffect, useRef, useState } from 'react'

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
//   dateMeta(dateIso, dateObj)  — returns { status, label, disabled, ariaLabel }
//   datePicker             — opt-in keyboard date-picker mode (booking dialog):
//                            one tab stop for the whole month (roving focus),
//                            arrow keys move by day/week, Home/End to the start/
//                            end of the week, PageUp/PageDown by month.
//                            Unavailable days stay focusable (announced via
//                            ariaLabel) but can't be picked. Plain buttons in a
//                            labelled group instead of grid roles.
//   prevDisabled           — disables "Previous month" (e.g. on the current month)
// The admin calendar passes neither, so its behaviour is unchanged.

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
  datePicker = false,
  prevDisabled = false,
}) {
  const [internalMonth, setInternalMonth] = useState({ month, year })
  const current = onMonthChange ? { month, year } : internalMonth
  const gridRef = useRef(null)
  const [focusIso, setFocusIso] = useState(null)
  const pendingFocus = useRef(false)

  function setView(payload) {
    if (onMonthChange) onMonthChange(payload)
    else setInternalMonth(payload)
  }

  function changeMonth(delta) {
    const next = new Date(current.year, current.month + delta, 1)
    setView({ month: next.getMonth(), year: next.getFullYear() })
  }

  // After a keyboard move re-renders the grid, put focus on the target day.
  useEffect(() => {
    if (!pendingFocus.current || !focusIso) return
    pendingFocus.current = false
    gridRef.current?.querySelector(`[data-iso="${focusIso}"]`)?.focus()
  })

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

  const cells = weeks.flat().map((date) => {
    const iso = toIsoDate(date)
    return { date, iso, inMonth: date.getMonth() === current.month, meta: dateMeta ? dateMeta(iso, date) : {} }
  })

  // Roving focus: exactly one day is in the tab order.
  let tabIso = null
  if (datePicker) {
    if (focusIso && cells.some((c) => c.iso === focusIso)) tabIso = focusIso
    else if (selectedDate && cells.some((c) => c.iso === selectedDate && c.inMonth)) tabIso = selectedDate
    else tabIso = (cells.find((c) => c.inMonth && !c.meta.disabled) || cells.find((c) => c.inMonth)).iso
  }

  function moveFocus(fromDate, days, months = 0) {
    const target = new Date(fromDate)
    if (months) target.setMonth(target.getMonth() + months)
    else target.setDate(target.getDate() + days)
    const targetIndex = target.getFullYear() * 12 + target.getMonth()
    const currentIndex = current.year * 12 + current.month
    if (targetIndex !== currentIndex) {
      if (targetIndex < currentIndex && prevDisabled) return // no earlier months
      setView({ month: target.getMonth(), year: target.getFullYear() })
    }
    setFocusIso(toIsoDate(target))
    pendingFocus.current = true
  }

  function onKeyDown(e, date) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (step) { e.preventDefault(); moveFocus(date, step); return }
    if (e.key === 'Home') { e.preventDefault(); moveFocus(date, -date.getDay()); return }
    if (e.key === 'End') { e.preventDefault(); moveFocus(date, 6 - date.getDay()); return }
    if (e.key === 'PageUp') { e.preventDefault(); moveFocus(date, 0, -1); return }
    if (e.key === 'PageDown') { e.preventDefault(); moveFocus(date, 0, 1) }
  }

  const monthLabel = `${MONTH_NAMES[current.month]} ${current.year}`

  return (
    <div className={`month-calendar${compact ? ' month-calendar--compact' : ''}`}>
      <header className="month-calendar-header">
        <button type="button" className="month-calendar-nav" onClick={() => changeMonth(-1)} aria-label="Previous month" disabled={prevDisabled}>‹</button>
        <h3>{monthLabel}</h3>
        <button type="button" className="month-calendar-nav" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
      </header>
      <div
        ref={gridRef}
        className="month-calendar-grid"
        role={datePicker ? 'group' : 'grid'}
        aria-label={datePicker ? monthLabel : undefined}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="month-calendar-dayname"
            role={datePicker ? undefined : 'columnheader'}
            aria-hidden={datePicker || undefined}
          >
            {d}
          </div>
        ))}
        {cells.map(({ date, iso, inMonth, meta }) => {
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
              data-iso={iso}
              role={datePicker ? undefined : 'gridcell'}
              aria-selected={datePicker ? undefined : isSelected}
              aria-pressed={datePicker ? isSelected : undefined}
              aria-disabled={!!meta.disabled}
              aria-label={meta.ariaLabel /* optional, e.g. "Mon 24 Nov, 2 times free" */}
              // Date-picker mode keeps unavailable days focusable (so they're
              // announced) but ignores clicks on them.
              disabled={datePicker ? undefined : !!meta.disabled}
              tabIndex={datePicker ? (iso === tabIso ? 0 : -1) : undefined}
              onFocus={datePicker ? () => setFocusIso(iso) : undefined}
              onKeyDown={datePicker ? (e) => onKeyDown(e, date) : undefined}
              onClick={() => {
                if (datePicker && meta.disabled) return
                onSelectDate?.(iso, date)
              }}
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
