import { useEffect, useRef, useState } from 'react'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  date: '',
  time: '',
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

  const today = new Date().toISOString().split('T')[0]

  // Keep onClose in a ref so the open/close effect doesn't re-fire whenever
  // the parent re-renders (which would close+reopen the dialog mid-interaction).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Open the native dialog on mount; sync Escape → onClose. We intentionally do
  // NOT call dialog.close() in cleanup — that queues an async `close` event
  // which, under StrictMode's cleanup→remount cycle, is caught by the next
  // mount's listener and immediately unmounts us. Real unmount closes the
  // dialog implicitly when the element is removed from the DOM.
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

  // Click outside the dialog panel = close. Clicks inside bubble but land on children.
  function handleBackdropClick(e) {
    const dialog = dialogRef.current
    if (!dialog || e.target !== dialog) return
    onClose()
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
    if (Object.keys(errs).length > 0) {
      document.getElementById(Object.keys(errs)[0])?.focus()
      return
    }
    // Frontend-only for now: snapshot the booking and show the confirmation.
    // When wiring real email: POST { ...cleaned, package: pkg.name, price: pkg.price }
    // to Netlify Forms / a backend here, and set `submitted` on success. Subject
    // line should be "New Booking: " + pkg.name.
    const cleaned = { ...form, location: form.location.trim() }
    setSubmitted(cleaned)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
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
          <form className="booking-modal-form" onSubmit={handleSubmit} noValidate={false}>
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

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="date">Preferred date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  min={today}
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="time">Preferred time</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                />
              </div>
            </div>

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
                aria-describedby={errors.location ? 'location-error' : undefined}
              />
              {errors.location && (
                <p className="form-error" id="location-error" role="alert">
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
                placeholder="Anything else I should know? Style references, people involved, etc."
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
  const when = booking.time ? `${booking.date} at ${booking.time}` : booking.date
  const where = booking.location

  return (
    <div className="booking-modal-confirmation">
      <h3>Thanks — request received</h3>
      <p>I'll be in touch within 48 hours to confirm.</p>
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
