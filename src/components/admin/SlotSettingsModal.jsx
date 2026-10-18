import { useState } from 'react'
import AdminModal from './AdminModal.jsx'
import * as slotsService from '../../services/slotsService.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SlotSettingsModal({ onClose, onChanged }) {
  const current = slotsService.getSettings()
  const [workingDays, setWorkingDays] = useState(current.workingDays)
  const [maxPerSlot, setMaxPerSlot] = useState(current.maxBookingsPerSlot)

  function toggleDay(day) {
    setWorkingDays((wd) => (wd.includes(day) ? wd.filter((d) => d !== day) : [...wd, day].sort()))
  }

  function handleSave(e) {
    e.preventDefault()
    slotsService.updateSettings({
      workingDays,
      maxBookingsPerSlot: Math.max(1, Number(maxPerSlot) || 1),
    })
    onChanged('Slot settings updated.')
    onClose()
  }

  return (
    <AdminModal onClose={onClose} labelledBy="slot-settings-title">
      <div className="admin-modal-panel">
        <header className="admin-modal-header">
          <div>
            <p className="admin-modal-eyebrow">Calendar</p>
            <h2 id="slot-settings-title">Slot settings</h2>
          </div>
          <button type="button" className="booking-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <form className="booking-action-form" onSubmit={handleSave}>
          <section>
            <h3 className="settings-section-title">Working days</h3>
            <p className="muted settings-section-help">Days of the week the studio takes shoots.</p>
            <div className="settings-day-row">
              {DAY_LABELS.map((label, idx) => (
                <label key={idx} className={`settings-day-chip${workingDays.includes(idx) ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={workingDays.includes(idx)}
                    onChange={() => toggleDay(idx)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="settings-section-title">Time slots</h3>
            <p className="muted settings-section-help">
              Fixed daily slots. Each new booking occupies one or more consecutive slots depending on its package.
            </p>
            <ul className="settings-slot-list">
              {current.slots.map((s) => (
                <li key={s.id}><span>{s.label}</span></li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="settings-section-title">Package slot usage</h3>
            <ul className="settings-slot-list">
              {Object.entries(current.packageSlots).map(([name, count]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="muted">{count} slot{count === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="form-field">
              <label htmlFor="max-per-slot">Max bookings per slot</label>
              <input
                type="number"
                id="max-per-slot"
                min="1"
                max="5"
                value={maxPerSlot}
                onChange={(e) => setMaxPerSlot(e.target.value)}
              />
            </div>
          </section>

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save settings</button>
          </div>
        </form>
      </div>
    </AdminModal>
  )
}
