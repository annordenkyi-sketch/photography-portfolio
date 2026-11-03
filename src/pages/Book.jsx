import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { packages } from '../data/packages.js'
import * as bookings from '../services/bookingsService.js'

// /book — booking request form. Reads ?package=<id> and preselects the
// matching package in the dropdown. Submits via bookingsService (demo:
// persists to localStorage; the Go backend will replace this later).
// No animation. Shows success state in place of the form on submit.
export default function Book() {
  const [searchParams] = useSearchParams()
  const queryPkgId = searchParams.get('package')

  const defaultPkgId = useMemo(() => {
    if (queryPkgId && packages.some((p) => p.id === queryPkgId)) return queryPkgId
    const featured = packages.find((p) => p.featured)
    return (featured || packages[0] || { id: '' }).id
  }, [queryPkgId])

  const [pkgId, setPkgId] = useState(defaultPkgId)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // 'idle'|'submitting'|'success'|'error'
  const [errors, setErrors] = useState({})
  const successRef = useRef(null)

  useEffect(() => { setPkgId(defaultPkgId) }, [defaultPkgId])
  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  const selectedPkg = packages.find((p) => p.id === pkgId) || null

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Please enter your name.'
    if (!email.trim()) newErrors.email = 'Please enter your email.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) newErrors.email = 'Please enter a valid email.'
    if (!phone.trim()) newErrors.phone = 'Please enter a phone number.'
    if (!date) newErrors.date = 'Please pick a preferred date.'
    if (!pkgId) newErrors.pkg = 'Please choose a package.'
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      setStatus('error')
      return
    }

    setErrors({})
    setStatus('submitting')

    try {
      bookings.add({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date,
        packageId: pkgId,
        packageName: selectedPkg?.name || '',
        message: message.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      setStatus('success')
    } catch {
      setStatus('error')
      setErrors({ form: 'Something went wrong — please try again.' })
    }
  }

  return (
    <main className="book-page">
      <a href="/" className="back-link" aria-label="Back to home">
        <span className="back-link-arrow" aria-hidden="true">←</span>
        <span>Back to home</span>
      </a>

      <header className="book-head">
        <h1>Book a shoot</h1>
        <p className="book-intro">
          Tell me a bit about what you need and I&rsquo;ll follow up within 48
          hours to confirm.
        </p>
      </header>

      {status === 'success' ? (
        <div className="book-success" role="status">
          <h2
            ref={successRef}
            tabIndex="-1"
            className="book-success-title"
          >
            Request received — thank you.
          </h2>
          <p>
            I&rsquo;ll reach out to <strong>{email}</strong> within 48 hours
            to confirm your date and the deposit.
          </p>
          <div className="book-success-actions">
            <Link to="/packages" className="btn btn-secondary">
              Back to packages
            </Link>
            <Link to="/" className="btn btn-primary">
              Home
            </Link>
          </div>
        </div>
      ) : (
        <>
          {errors.form && (
            <p className="form-error form-error--banner" role="alert">
              {errors.form}
            </p>
          )}
          <form className="book-form" noValidate onSubmit={handleSubmit}>
            <div className="book-form-field">
              <label htmlFor="book-pkg">Package</label>
              <select
                id="book-pkg"
                value={pkgId}
                onChange={(e) => setPkgId(e.target.value)}
                aria-invalid={errors.pkg ? 'true' : 'false'}
                aria-describedby={errors.pkg ? 'book-pkg-err' : undefined}
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price}
                  </option>
                ))}
              </select>
              {errors.pkg && <p id="book-pkg-err" className="form-error">{errors.pkg}</p>}
            </div>

            <div className="book-form-row">
              <div className="book-form-field">
                <label htmlFor="book-name">Name <span aria-hidden="true">*</span></label>
                <input
                  id="book-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'book-name-err' : undefined}
                />
                {errors.name && <p id="book-name-err" className="form-error">{errors.name}</p>}
              </div>

              <div className="book-form-field">
                <label htmlFor="book-email">Email <span aria-hidden="true">*</span></label>
                <input
                  id="book-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'book-email-err' : undefined}
                />
                {errors.email && <p id="book-email-err" className="form-error">{errors.email}</p>}
              </div>
            </div>

            <div className="book-form-row">
              <div className="book-form-field">
                <label htmlFor="book-phone">Phone <span aria-hidden="true">*</span></label>
                <input
                  id="book-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'book-phone-err' : undefined}
                />
                {errors.phone && <p id="book-phone-err" className="form-error">{errors.phone}</p>}
              </div>

              <div className="book-form-field">
                <label htmlFor="book-date">Preferred date <span aria-hidden="true">*</span></label>
                <input
                  id="book-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={errors.date ? 'true' : 'false'}
                  aria-describedby={errors.date ? 'book-date-err' : undefined}
                />
                {errors.date && <p id="book-date-err" className="form-error">{errors.date}</p>}
              </div>
            </div>

            <div className="book-form-field">
              <label htmlFor="book-notes">Notes</label>
              <textarea
                id="book-notes"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Location, mood, anyone special joining the shoot…"
              />
            </div>

            <div className="book-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Send booking request'}
              </button>
              <p className="form-required-note">Fields marked * are required.</p>
            </div>
          </form>
        </>
      )}
    </main>
  )
}
