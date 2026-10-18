import { useState } from 'react'
import * as authService from '../../services/authService.js'
import * as studioProfile from '../../services/studioProfileService.js'
import * as bookingsService from '../../services/bookingsService.js'
import * as paymentsService from '../../services/paymentsService.js'
import * as slotsService from '../../services/slotsService.js'
import * as notificationsService from '../../services/notificationsService.js'
import * as portfolioService from '../../services/portfolioService.js'

function formatDateTime(iso) {
  if (!iso) return 'Not available'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminSettings() {
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3500)
  }

  return (
    <div className="admin-settings-page">
      <StudioProfileCard onSaved={showToast} />
      <AccountSecurityCard onSaved={showToast} />
      <DemoDataCard onDone={showToast} />
      {toast && (
        <div className="admin-toast" role="status" aria-live="polite">{toast}</div>
      )}
    </div>
  )
}

/* --- Studio profile ---------------------------------------------------- */

function StudioProfileCard({ onSaved }) {
  const current = studioProfile.getProfile()
  const [form, setForm] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Studio name is required.'); return }
    setSaving(true)
    studioProfile.updateProfile({
      ...form,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
    })
    setSaving(false)
    onSaved('Studio profile saved.')
  }

  function handleRevert() {
    if (!window.confirm('Revert all profile fields to the defaults?')) return
    studioProfile.reset()
    setForm(studioProfile.getProfile())
    onSaved('Studio profile reset.')
  }

  return (
    <section className="settings-card">
      <header className="settings-card-header">
        <h2>Studio profile</h2>
        <p>Shown on the public site, in receipts, and in booking confirmations.</p>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-form-row">
          <label className="settings-form-field">
            <span>Studio name *</span>
            <input name="name" value={form.name} onChange={handleChange} autoComplete="organization" required />
          </label>
          <label className="settings-form-field">
            <span>Short tagline</span>
            <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="e.g. Weddings · Portraits · Events" />
          </label>
        </div>

        <div className="settings-form-row">
          <label className="settings-form-field">
            <span>Contact email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" />
          </label>
          <label className="settings-form-field">
            <span>Phone</span>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" placeholder="+233 20 000 0000" />
          </label>
        </div>

        <label className="settings-form-field">
          <span>Address</span>
          <input name="address" value={form.address} onChange={handleChange} placeholder="City, Country" />
        </label>

        <h3 className="settings-sub-head">Social & web</h3>
        <div className="settings-form-row">
          <label className="settings-form-field">
            <span>Website</span>
            <input name="website" value={form.website} onChange={handleChange} placeholder="example.com" />
          </label>
          <label className="settings-form-field">
            <span>Instagram handle</span>
            <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@yourhandle" />
          </label>
          <label className="settings-form-field">
            <span>Facebook page</span>
            <input name="facebook" value={form.facebook} onChange={handleChange} placeholder="yourpage" />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="settings-form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleRevert}>Revert to defaults</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* --- Account & security ----------------------------------------------- */

function AccountSecurityCard({ onSaved }) {
  const creds = authService.getCredentials()
  const lastLogin = authService.getLastLogin()
  const [email, setEmail] = useState(creds.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!currentPassword) {
      setError('Enter your current password to confirm the change.')
      return
    }
    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setSaving(true)
    try {
      authService.updateCredentials({
        currentPassword,
        email,
        newPassword: newPassword || undefined,
      })
      onSaved('Account updated. Next login will use the new credentials.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleLogoutAll() {
    if (!window.confirm('Log out of this device? In the demo, this ends the current session.')) return
    authService.logout()
    window.location.href = '/admin/login'
  }

  const browser = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  return (
    <section className="settings-card">
      <header className="settings-card-header">
        <h2>Account & security</h2>
        <p>Change the admin email, password, and see your recent session.</p>
      </header>

      <dl className="settings-dl">
        <dt>Signed in as</dt>
        <dd>{creds.email}</dd>
        <dt>Last sign-in</dt>
        <dd>{formatDateTime(lastLogin)}</dd>
        <dt>Browser</dt>
        <dd className="settings-dd-wrap">{browser || 'Unknown'}</dd>
      </dl>

      <form className="settings-form" onSubmit={handleSubmit}>
        <h3 className="settings-sub-head">Update credentials</h3>

        <label className="settings-form-field">
          <span>Admin email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>

        <label className="settings-form-field">
          <span>Current password *</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Required to confirm any change"
            required
          />
        </label>

        <div className="settings-form-row">
          <label className="settings-form-field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
          </label>
          <label className="settings-form-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat the new password"
            />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="settings-form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleLogoutAll}>
            Log out of this device
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Update account'}
          </button>
        </div>
      </form>
    </section>
  )
}

/* --- Demo data -------------------------------------------------------- */

function DemoDataCard({ onDone }) {
  async function handleReset() {
    const ok = window.confirm(
      'Reset all demo data? This clears bookings, payments, notifications, slot settings, date blocks, uploaded photos, studio profile, and admin credential overrides.',
    )
    if (!ok) return
    bookingsService.reset()
    paymentsService.reset()
    slotsService.reset()
    notificationsService.reset()
    studioProfile.reset()
    authService.resetCredentials()
    try { await portfolioService.reset() } catch { /* ignore */ }
    onDone('Demo data cleared — reloading…')
    window.setTimeout(() => window.location.reload(), 400)
  }

  return (
    <section className="settings-card">
      <header className="settings-card-header">
        <h2>Demo data</h2>
        <p>
          Changes you make during the demo are saved in this browser only. Reset to the seed state at any time.
        </p>
      </header>
      <div className="settings-form-actions">
        <button type="button" className="btn btn-danger" onClick={handleReset}>
          Reset demo data
        </button>
      </div>
    </section>
  )
}
