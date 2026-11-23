import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import MonthCalendar from './admin/MonthCalendar.jsx'
import * as bookingsService from '../services/bookingsService.js'
import * as slotsService from '../services/slotsService.js'
import * as notificationsService from '../services/notificationsService.js'
import { formatCedis } from '../data/packages.js'

// Booking dialog opened from the Packages page (native <dialog>).
//
// Layout: desktop = two columns (package summary with photo | form);
// phones = full-screen sheet with a compact summary on top. The form has
// three sections (Your details · Date and time · Location and notes) with
// floating labels and inline validation, and a sticky footer with the
// total, the deposit and "Confirm booking".
//
// Motion (CSS: rule 10 "/packages + booking pop-up motion" and the
// BOOKING DIALOG block in index.css; reduced motion keeps fades only):
// - Opens with a scale + fade from the clicked card (`origin` = card
//   centre in viewport px); the blurred backdrop fades in. On phones the
//   sheet rises instead.
// - Summary, header, each section and the footer appear one after another.
// - Picking a date staggers the time-slot chips in.
// - Confirm shows a "Confirming…" state, then a success screen with a
//   drawn checkmark and the booking summary sliding in.
// - Closing plays the opening in reverse: ×, Cancel/Close, Escape
//   (dialog `cancel` event) or a click on the backdrop. The dialog is then
//   closed with close(), which returns focus to the element that opened it.

const CLOSE_MS = 260 // keep in sync with .bk-dialog.is-closing in CSS
const SEND_MS = 650 // short "Confirming…" state before the success screen

// Ghana's 16 regions.
const REGIONS = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
  'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
  'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
]

const emptyForm = { name: '', phone: '', email: '', region: '', town: '', notes: '' }

// Order used to move focus to the first problem on submit.
const FIELD_ORDER = ['name', 'phone', 'email', 'date', 'slot', 'region', 'town']
const FOCUS_ID = {
  name: 'bk2-name', phone: 'bk2-phone', email: 'bk2-email',
  date: 'bk2-date-group', slot: 'bk2-date-group',
  region: 'bk2-region', town: 'bk2-town',
}

function validateField(field, values, extra = {}) {
  const v = (values[field] ?? '').trim?.() ?? ''
  switch (field) {
    case 'name':
      return v ? '' : 'Please enter your full name.'
    case 'phone':
      if (!v) return 'Please enter a phone number.'
      return /^\+?[\d\s()-]{9,}$/.test(v) ? '' : 'Please enter a valid phone number, e.g. +233 24 123 4567.'
    case 'email':
      return !v || /^\S+@\S+\.\S+$/.test(v) ? '' : 'Please enter a valid email address, or leave it blank.'
    case 'region':
      return v ? '' : 'Please choose a region.'
    case 'town':
      return v ? '' : 'Please enter your town or area.'
    case 'date':
      return extra.date ? '' : 'Please pick a date.'
    case 'slot':
      return !extra.date || extra.slotRun ? '' : 'Please pick an available time.'
    default:
      return ''
  }
}

function shortDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function longDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingModal({ pkg, onClose, origin = null, photo = null }) {
  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [date, setDate] = useState('')
  const [slotRun, setSlotRun] = useState(null)

  const today = new Date()
  const [monthView, setMonthView] = useState({ month: today.getMonth(), year: today.getFullYear() })

  const slotsNeeded = slotsService.getPackageSlotCount(pkg.name)
  const deposit = Math.round(((pkg.amount || 0) * (pkg.depositPercent || 0)) / 100)

  const dateMeta = useMemo(() => {
    const todayIso = today.toISOString().split('T')[0]
    return (iso) => {
      if (iso < todayIso) return { status: 'default', disabled: true }
      const avail = slotsService.getDayAvailability(iso)
      if (avail.kind === 'offday') return { status: 'offday', label: 'Off', disabled: true }
      if (avail.kind === 'blocked') return { status: 'blocked', label: 'Blocked', disabled: true }
      const canFit = slotsService.getAvailableRuns(iso, slotsNeeded).length > 0
      if (!canFit) return { status: 'full', label: 'Full', disabled: true }
      return { status: avail.kind, label: `${avail.available}/${avail.total}` }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsNeeded])

  const runs = useMemo(() => {
    if (!date) return []
    return slotsService.getAvailableRuns(date, slotsNeeded)
  }, [date, slotsNeeded])

  // Keep onClose stable for the native dialog listeners
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Animated close: play the exit, then close() the dialog (which fires
  // `close` → onClose and returns focus to the opener).
  const closingRef = useRef(false)
  const closeTimer = useRef(null)
  function requestClose() {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    closeTimer.current = window.setTimeout(() => { dialogRef.current?.close() }, reduced ? 120 : CLOSE_MS)
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  // Open as a modal, growing from the clicked card (origin set before
  // first paint so the animation starts there).
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!dialog.open) dialog.showModal()
    if (origin) {
      const r = dialog.getBoundingClientRect()
      dialog.style.setProperty('--bk-origin', `${Math.round(origin.x - r.left)}px ${Math.round(origin.y - r.top)}px`)
    }
    const onNativeClose = () => onCloseRef.current()
    const onCancel = (e) => {
      if (e.cancelable) { e.preventDefault(); requestCloseRef.current() }
    }
    dialog.addEventListener('close', onNativeClose)
    dialog.addEventListener('cancel', onCancel)
    return () => {
      dialog.removeEventListener('close', onNativeClose)
      dialog.removeEventListener('cancel', onCancel)
      window.clearTimeout(closeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) requestClose()
  }

  function setFieldError(field, message) {
    setErrors((prev) => {
      if ((prev[field] || '') === message) return prev
      const next = { ...prev }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)
    // Once a field has been left once, re-check it as the user types.
    if (touched[name] || errors[name]) setFieldError(name, validateField(name, next))
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((t) => ({ ...t, [name]: true }))
    setFieldError(name, validateField(name, form))
  }

  function pickDate(iso) {
    setDate(iso)
    setSlotRun(null)
    setFieldError('date', '')
    setFieldError('slot', '')
  }

  function pickSlot(run) {
    setSlotRun(run)
    setFieldError('slot', '')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (sending) return
    const extra = { date, slotRun }
    const all = {}
    for (const f of FIELD_ORDER) {
      const msg = validateField(f, form, extra)
      if (msg) all[f] = msg
    }
    setErrors(all)
    setTouched({ name: true, phone: true, email: true, region: true, town: true })
    const first = FIELD_ORDER.find((f) => all[f])
    if (first) {
      document.getElementById(FOCUS_ID[first])?.focus()
      return
    }

    setSending(true)
    const values = form
    const run = slotRun
    const day = date
    window.setTimeout(() => {
      const town = values.town.trim()
      const location = `${town}, ${values.region}`
      const created = bookingsService.add({
        clientName: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        package: pkg.name,
        totalAmount: pkg.amount || 0,
        date: day,
        time: run.startSlot.start,
        slotIds: run.slotIds,
        location,
        region: values.region,
        town,
        notes: values.notes.trim(),
        status: 'pending',
      })

      try {
        notificationsService.add({
          type: 'new_booking',
          message: `${created.clientName} booked ${pkg.name} for ${shortDate(day)}`,
          targetType: 'booking',
          targetId: created.id,
        })
      } catch { /* non-browser */ }

      setSubmitted({ date: day, slotLabel: run.label, location })
      setSending(false)
      setForm(emptyForm)
      setErrors({})
      setTouched({})
      setDate('')
      setSlotRun(null)
      scrollRef.current?.scrollTo({ top: 0 })
    }, SEND_MS)
  }

  const fieldProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
  })

  return (
    <dialog
      ref={dialogRef}
      className={`bk2 bk-dialog${closing ? ' is-closing' : ''}`}
      onClick={handleBackdropClick}
      aria-labelledby="bk2-title"
    >
      <div className="bk2-shell" ref={scrollRef}>
        <header className="bk2-head bk-in" style={{ '--i': 0 }}>
          <div>
            <h2 id="bk2-title" className="bk2-title">{submitted ? 'Request sent' : 'Book your session'}</h2>
            <p className="bk2-sub">
              {submitted ? 'Thank you — here’s what you booked.' : 'Pick a date and I’ll confirm within 48 hours.'}
            </p>
          </div>
          <button type="button" className="bk2-close" onClick={requestClose} aria-label="Close booking dialog">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <aside className="bk2-summary bk-in" style={{ '--i': 0 }} aria-label="Package summary">
          <div className="bk2-photo">
            {photo && <img src={photo.src} alt={photo.alt} width="800" height="600" loading="lazy" decoding="async" />}
          </div>
          <div className="bk2-summary-body">
            <p className="bk2-eyebrow">Your package</p>
            <p className="bk2-pkg-name">{pkg.name}</p>
            <p className="bk2-pkg-price">From {pkg.price}</p>
            <p className="bk2-pkg-meta">
              <span>{pkg.duration}</span>
              {pkg.editedPhotos != null && <span>{pkg.editedPhotos} edited photos</span>}
            </p>
            {pkg.features?.length > 0 && (
              <ul className="bk2-includes" aria-label="What’s included">
                {pkg.features.map((f) => (
                  <li key={f}>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {submitted ? (
          <Confirmation booking={submitted} pkg={pkg} deposit={deposit} onClose={requestClose} />
        ) : (
          <>
            <form id="bk2-form" className="bk2-body" onSubmit={handleSubmit} noValidate aria-busy={sending || undefined}>
              <fieldset className="bk2-section bk-in" style={{ '--i': 1 }}>
                <legend><span className="bk2-step" aria-hidden="true">1</span>Your details</legend>
                <TextField id="bk2-name" label="Full name" required autoComplete="name" {...fieldProps('name')} />
                <div className="bk2-row">
                  <TextField id="bk2-phone" label="Phone number" type="tel" required autoComplete="tel" inputMode="tel" {...fieldProps('phone')} />
                  <TextField id="bk2-email" label="Email (optional)" type="email" autoComplete="email" {...fieldProps('email')} />
                </div>
              </fieldset>

              <fieldset className="bk2-section bk-in" style={{ '--i': 2 }}>
                <legend><span className="bk2-step" aria-hidden="true">2</span>Date and time</legend>
                <div
                  id="bk2-date-group"
                  tabIndex={-1}
                  className={`bk2-date${errors.date ? ' has-error' : ''}`}
                  aria-describedby={errors.date ? 'bk2-date-err' : 'bk2-date-help'}
                >
                  <p id="bk2-date-help" className="bk2-help">
                    {pkg.name} takes {slotsNeeded} slot{slotsNeeded === 1 ? '' : 's'}. Greyed-out dates are closed, blocked or full.
                  </p>
                  <MonthCalendar
                    month={monthView.month}
                    year={monthView.year}
                    onMonthChange={setMonthView}
                    selectedDate={date}
                    onSelectDate={pickDate}
                    dateMeta={dateMeta}
                    compact
                  />
                  {errors.date && <p id="bk2-date-err" className="bk2-error" role="alert">{errors.date}</p>}
                </div>

                {date && (
                  <div className="bk2-slots">
                    <p className="bk2-slots-label" id="bk2-slots-label">Available times · {longDate(date)}</p>
                    {runs.length === 0 ? (
                      <p className="bk2-help bk-slot" style={{ '--i': 0 }}>No times left on this date — try another.</p>
                    ) : (
                      // Re-keyed per date so the chips stagger in each time.
                      <div className="bk2-chips" role="group" aria-labelledby="bk2-slots-label" key={date}>
                        {runs.map((run, i) => {
                          const picked = slotRun?.startSlot.id === run.startSlot.id
                          return (
                            <button
                              key={run.startSlot.id}
                              type="button"
                              className={`bk2-chip bk-slot${picked ? ' is-picked' : ''}`}
                              style={{ '--i': i }}
                              aria-pressed={picked}
                              onClick={() => pickSlot(run)}
                            >
                              {run.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.slot && <p className="bk2-error" role="alert">{errors.slot}</p>}
                  </div>
                )}
              </fieldset>

              <fieldset className="bk2-section bk-in" style={{ '--i': 3 }}>
                <legend><span className="bk2-step" aria-hidden="true">3</span>Location and notes</legend>
                <div className="bk2-row">
                  <SelectField id="bk2-region" label="Region" required options={REGIONS} {...fieldProps('region')} />
                  <TextField id="bk2-town" label="Town or area" required autoComplete="address-level2" {...fieldProps('town')} />
                </div>
                <TextField id="bk2-notes" label="Notes (optional)" as="textarea" {...fieldProps('notes')} hint="Who’s involved, the occasion, any style references." />
              </fieldset>
            </form>

            <footer className="bk2-foot bk-in" style={{ '--i': 4 }}>
              <dl className="bk2-totals">
                <div><dt>Total</dt><dd>{formatCedis(pkg.amount)}</dd></div>
                {deposit > 0 && (
                  <div><dt>Deposit ({pkg.depositPercent}%)</dt><dd>{formatCedis(deposit)}</dd></div>
                )}
              </dl>
              <button
                type="submit"
                form="bk2-form"
                className={`bk2-confirm bk-press bk-submit${sending ? ' is-sending' : ''}`}
                disabled={sending}
              >
                <span>{sending ? 'Confirming…' : 'Confirm booking'}</span>
                <span className="bk-submit-bar" aria-hidden="true" />
              </button>
              <p className="pk-sr-only" role="status">{sending ? 'Sending your booking request…' : ''}</p>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}

// Floating-label text input / textarea with an inline error.
function TextField({ id, name, label, value, onChange, onBlur, error, required, type = 'text', as, autoComplete, inputMode, hint }) {
  const Tag = as === 'textarea' ? 'textarea' : 'input'
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`bk2-field${error ? ' has-error' : ''}${as === 'textarea' ? ' bk2-field--area' : ''}`}>
      <Tag
        id={id}
        name={name}
        type={Tag === 'input' ? type : undefined}
        rows={Tag === 'textarea' ? 3 : undefined}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder=" "
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <label htmlFor={id}>{label}{required && <span className="bk2-req" aria-hidden="true"> *</span>}</label>
      {hint && !error && <p id={`${id}-hint`} className="bk2-hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="bk2-error" role="alert">{error}</p>}
    </div>
  )
}

// Floating-label select (label floats once a value is chosen).
function SelectField({ id, name, label, value, onChange, onBlur, error, required, options }) {
  return (
    <div className={`bk2-field bk2-field--select${error ? ' has-error' : ''}${value ? ' has-value' : ''}`}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        <option value="" disabled hidden />
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <label htmlFor={id}>{label}{required && <span className="bk2-req" aria-hidden="true"> *</span>}</label>
      {error && <p id={`${id}-err`} className="bk2-error" role="alert">{error}</p>}
    </div>
  )
}

function Confirmation({ booking, pkg, deposit, onClose }) {
  const headingRef = useRef(null)
  // Move focus to the result so keyboard and screen-reader users land on it.
  useEffect(() => { headingRef.current?.focus() }, [])

  return (
    <div className="bk2-body bk2-done bk-confirm">
      <svg className="bk-check" viewBox="0 0 52 52" width="56" height="56" aria-hidden="true">
        <circle className="bk-check-ring" cx="26" cy="26" r="24" fill="none" />
        <path className="bk-check-mark" fill="none" d="M15 27 l7 7 l15 -16" />
      </svg>
      <h3 ref={headingRef} tabIndex={-1}>Booking request received</h3>
      <div className="bk-confirm-body">
        <p className="bk2-done-text">
          Your slot is held while I review your request. I’ll be in touch within 48 hours to confirm
          and arrange the deposit.
        </p>
        <dl className="bk2-recap">
          <div><dt>Package</dt><dd>{pkg.name}</dd></div>
          <div><dt>Date</dt><dd>{longDate(booking.date)}</dd></div>
          <div><dt>Time</dt><dd>{booking.slotLabel}</dd></div>
          <div><dt>Location</dt><dd>{booking.location}</dd></div>
          <div><dt>Total</dt><dd>{formatCedis(pkg.amount)}</dd></div>
          {deposit > 0 && <div><dt>Deposit to confirm</dt><dd>{formatCedis(deposit)}</dd></div>}
        </dl>
        <button type="button" className="bk2-confirm bk-press" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
