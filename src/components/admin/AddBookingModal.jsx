import { useMemo, useState } from 'react'
import AdminModal from './AdminModal.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import { packages } from '../../data/packages.js'
import * as bookingsService from '../../services/bookingsService.js'
import * as slotsService from '../../services/slotsService.js'

const emptyForm = {
  clientName: '',
  phone: '',
  email: '',
  package: '',
  location: '',
  notes: '',
  status: 'confirmed',
}

export default function AddBookingModal({ onClose, onCreated, defaultDate }) {
  const [form, setForm] = useState(emptyForm)
  const [date, setDate] = useState(defaultDate || '')
  const [slotIds, setSlotIds] = useState([])
  const [errors, setErrors] = useState({})

  const today = new Date()
  const [monthView, setMonthView] = useState(() => {
    const base = defaultDate ? new Date(defaultDate + 'T00:00:00') : today
    return { month: base.getMonth(), year: base.getFullYear() }
  })

  const slotsNeeded = form.package ? slotsService.getPackageSlotCount(form.package) : 1

  const dateMeta = useMemo(() => {
    return (iso, d) => {
      const avail = slotsService.getDayAvailability(iso)
      if (avail.kind === 'offday') return { status: 'offday', label: 'Off', disabled: true }
      if (avail.kind === 'blocked') return { status: 'blocked', label: 'Blocked', disabled: true }
      const canFit = form.package ? slotsService.getAvailableRuns(iso, slotsNeeded).length > 0 : avail.available > 0
      if (!canFit) return { status: 'full', label: 'Full', disabled: true }
      return { status: avail.kind, label: `${avail.available}/${avail.total}` }
    }
  }, [form.package, slotsNeeded])

  const runs = useMemo(() => {
    if (!date || !form.package) return []
    return slotsService.getAvailableRuns(date, slotsNeeded)
  }, [date, form.package, slotsNeeded])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n })
    if (name === 'package') setSlotIds([])
  }

  function handleDate(iso) {
    setDate(iso)
    setSlotIds([])
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.clientName.trim()) errs.clientName = 'Client name is required.'
    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    if (!form.package) errs.package = 'Pick a package.'
    if (!date) errs.date = 'Pick a date.'
    if (!slotIds.length) errs.slot = 'Pick an available slot.'
    if (!form.location.trim()) errs.location = 'Location is required.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const pkg = packages.find((p) => p.name === form.package)
    const slot = slotsService.getSettings().slots.find((s) => s.id === slotIds[0])
    const created = bookingsService.add({
      clientName: form.clientName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      package: form.package,
      totalAmount: pkg?.amount || 0,
      date,
      time: slot?.start || '',
      slotIds,
      location: form.location.trim(),
      notes: form.notes.trim(),
      status: form.status,
    })
    onCreated(`Added booking for ${created.clientName}.`)
    onClose()
  }

  return (
    <AdminModal onClose={onClose} labelledBy="add-booking-title" size="wide">
      <div className="admin-modal-panel">
        <header className="admin-modal-header">
          <div>
            <p className="admin-modal-eyebrow">Phone / WhatsApp booking</p>
            <h2 id="add-booking-title">Add booking</h2>
          </div>
          <button type="button" className="booking-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <form className="booking-action-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="add-clientName">Client name *</label>
              <input type="text" id="add-clientName" name="clientName" value={form.clientName} onChange={handleChange} required aria-invalid={!!errors.clientName} />
              {errors.clientName && <p className="form-error">{errors.clientName}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="add-phone">Phone *</label>
              <input type="tel" id="add-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+233 24 123 4567" required aria-invalid={!!errors.phone} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="add-email">Email</label>
            <input type="email" id="add-email" name="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="add-package">Package *</label>
              <select id="add-package" name="package" value={form.package} onChange={handleChange} required aria-invalid={!!errors.package}>
                <option value="">Choose a package…</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — {p.price} ({slotsService.getPackageSlotCount(p.name)} slot{slotsService.getPackageSlotCount(p.name) === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
              {errors.package && <p className="form-error">{errors.package}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="add-status">Status</label>
              <select id="add-status" name="status" value={form.status} onChange={handleChange}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <section>
            <h3 className="settings-section-title">Date *</h3>
            <p className="muted settings-section-help">
              {form.package
                ? `Showing dates with ${slotsNeeded} consecutive slot${slotsNeeded === 1 ? '' : 's'} free.`
                : 'Pick a package first to see valid dates.'}
            </p>
            <MonthCalendar
              month={monthView.month}
              year={monthView.year}
              onMonthChange={setMonthView}
              selectedDate={date}
              onSelectDate={handleDate}
              dateMeta={dateMeta}
              compact
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </section>

          {date && form.package && (
            <section>
              <h3 className="settings-section-title">Slot *</h3>
              {runs.length === 0 ? (
                <p className="muted">No {slotsNeeded}-slot runs free on this date.</p>
              ) : (
                <div className="slot-picker">
                  {runs.map((run) => {
                    const picked = slotIds.join(',') === run.slotIds.join(',')
                    return (
                      <button
                        key={run.startSlot.id}
                        type="button"
                        className={`slot-pick${picked ? ' is-picked' : ''}`}
                        onClick={() => setSlotIds(run.slotIds)}
                      >
                        {run.label}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.slot && <p className="form-error">{errors.slot}</p>}
            </section>
          )}

          <div className="form-field">
            <label htmlFor="add-location">Location *</label>
            <input type="text" id="add-location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. East Legon, Accra" required aria-invalid={!!errors.location} />
            {errors.location && <p className="form-error">{errors.location}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="add-notes">Notes</label>
            <textarea id="add-notes" name="notes" rows="3" value={form.notes} onChange={handleChange} placeholder="Anything the admin should remember about this shoot." />
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add booking</button>
          </div>
        </form>
      </div>
    </AdminModal>
  )
}
