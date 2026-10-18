import { useEffect, useMemo, useRef, useState } from 'react'
import MonthCalendar from './admin/MonthCalendar.jsx'
import * as bookingsService from '../services/bookingsService.js'
import * as slotsService from '../services/slotsService.js'
import * as notificationsService from '../services/notificationsService.js'

function shortDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  location: '',
  notes: '',
}

function validate(values) {
  const errs = {}
  if (!values.location.trim()) errs.location = 'Please enter your location.'
  return errs
}

export default function BookingModal({ pkg, onClose }) {
  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [date, setDate] = useState('')
  const [slotRun, setSlotRun] = useState(null)
  const [slotError, setSlotError] = useState('')

  const today = new Date()
  const [monthView, setMonthView] = useState({ month: today.getMonth(), year: today.getFullYear() })

  const slotsNeeded = slotsService.getPackageSlotCount(pkg.name)

  const dateMeta = useMemo(() => {
    const todayIso = today.toISOString().split('T')[0]
    return (iso, d) => {
      // disable past
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

  // Keep onClose stable for native dialog close listener
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const closeHandler = () => onCloseRef.current()
    dialog.addEventListener('close', closeHandler)
    return () => {
      dialog.removeEventListener('close', closeHandler)
    }
  }, [])

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) onCloseRef.current()
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    let localSlotError = ''
    if (!date) localSlotError = 'Please pick a date.'
    else if (!slotRun) localSlotError = 'Please pick an available slot.'
    setSlotError(localSlotError)
    if (Object.keys(errs).length > 0 || localSlotError) {
      if (Object.keys(errs).length > 0) {
        document.getElementById(Object.keys(errs)[0])?.focus()
      }
      return
    }

    const slot = slotRun.startSlot
    const created = bookingsService.add({
      clientName: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      package: pkg.name,
      totalAmount: pkg.amount || 0,
      date,
      time: slot.start,
      slotIds: slotRun.slotIds,
      location: form.location.trim(),
      notes: form.notes.trim(),
      status: 'pending',
    })

    // Admin notification + toast
    try {
      notificationsService.add({
        type: 'new_booking',
        message: `${created.clientName} booked a ${pkg.name} shoot for ${shortDate(date)}`,
        targetType: 'booking',
        targetId: created.id,
      })
    } catch { /* non-browser */ }

    setSubmitted({
      ...created,
      date,
      slotLabel: slotRun.label,
    })
    setForm(emptyForm)
    setErrors({})
    setDate('')
    setSlotRun(null)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function reset() {
    setSubmitted(null)
  }

  return (
    <dialog
      ref={dialogRef}
      className="booking-modal"
      onClick={handleBackdropClick}
      aria-label={`Book the ${pkg.name} package`}
    >
      <div className="booking-modal-panel" ref={scrollRef}>
        <header className="booking-modal-header">
          <div>
            <p className="booking-modal-eyebrow">Book this package</p>
            <p className="booking-modal-price">
              <span>{pkg.price}</span> · <span>{pkg.duration}</span>
            </p>
          </div>
          <button
            type="button"
            className="booking-modal-close"
            onClick={onClose}
            aria-label="Close booking form"
          >
            ×
          </button>
        </header>

        {submitted ? (
          <Confirmation booking={submitted} pkg={pkg} onClose={onClose} />
        ) : (
          <form className="booking-modal-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="name">Full name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="phone">Phone number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="+233 24 123 4567"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Preferred date *</label>
              <p className="form-help">
                {pkg.name} needs {slotsNeeded} slot{slotsNeeded === 1 ? '' : 's'}. Grey dates are closed, blocked, or full.
              </p>
              <MonthCalendar
                month={monthView.month}
                year={monthView.year}
                onMonthChange={setMonthView}
                selectedDate={date}
                onSelectDate={(iso) => {
                  setDate(iso)
                  setSlotRun(null)
                  setSlotError('')
                }}
                dateMeta={dateMeta}
                compact
              />
            </div>

            {date && (
              <div className="form-field">
                <label>Preferred time *</label>
                {runs.length === 0 ? (
                  <p className="form-help">No available slots on this date — try another.</p>
                ) : (
                  <div className="slot-picker">
                    {runs.map((run) => {
                      const picked = slotRun?.startSlot.id === run.startSlot.id
                      return (
                        <button
                          key={run.startSlot.id}
                          type="button"
                          className={`slot-pick${picked ? ' is-picked' : ''}`}
                          onClick={() => {
                            setSlotRun(run)
                            setSlotError('')
                          }}
                        >
                          {run.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {slotError && (
              <p className="form-error" role="alert">{slotError}</p>
            )}

            <div className="form-field">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. East Legon, Accra"
                autoComplete="address-level2"
                aria-required="true"
                aria-invalid={!!errors.location}
                required
              />
              {errors.location && (
                <p className="form-error" role="alert">
                  {errors.location}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="notes">Additional notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                value={form.notes}
                onChange={handleChange}
                placeholder="Where will the shoot be? Who is involved? Any style notes or references?"
              />
            </div>

            <p className="form-note">* required</p>

            <div className="booking-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Request booking
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}

function Confirmation({ booking, pkg, onClose }) {
  const when = `${new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}, ${booking.slotLabel}`
  const where = booking.location

  return (
    <div className="booking-modal-confirmation">
      <h3>Thanks — request received</h3>
      <p>
        Your slot is now held while I review your request. I'll be in touch within 48 hours to
        confirm. A copy of what you sent is below.
      </p>
      <dl className="booking-summary">
        <dt>Package</dt>
        <dd>{pkg.name}</dd>
        <dt>Date</dt>
        <dd>{when}</dd>
        <dt>Location</dt>
        <dd>{where}</dd>
      </dl>
      <button type="button" className="btn btn-primary" onClick={onClose}>
        Close
      </button>
    </div>
  )
}
