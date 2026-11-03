import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import * as studioProfile from '../services/studioProfileService.js'
import * as contactService from '../services/contactService.js'

// /contact — same layout, header, footer, colours, fonts as the Home
// landing page (CREACY-style). No animation. Form posts to
// POST /api/contact (the planned Go backend); if the server is offline
// the message is queued in localStorage so the submitter isn't blocked.
export default function Contact() {
  const [profile, setProfile] = useState(() => studioProfile.getProfile())
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // 'idle'|'submitting'|'success'|'error'
  const [errors, setErrors] = useState({})
  const [deliveryNote, setDeliveryNote] = useState(null)
  const successHeadingRef = useRef(null)

  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Move focus into the success message when it appears, for screen reader
  // + keyboard users; prevents them from being stranded on the form.
  useEffect(() => {
    if (status === 'success') successHeadingRef.current?.focus()
  }, [status])

  const studioName = profile.name || '[STUDIO NAME]'
  const emailAddr = profile.email || '[EMAIL]'
  const phoneDisplay = profile.phone || '[PHONE]'
  const waDigits = (profile.phone || '').replace(/[^\d]/g, '')
  const waHref = waDigits ? `https://wa.me/${waDigits}` : null
  const waDisplay = waHref ? `wa.me/${waDigits}` : '[WHATSAPP LINK]'
  const igHandle = (profile.instagram || '').replace(/^@/, '')
  const igHref = igHandle ? `https://instagram.com/${igHandle}` : null
  const igDisplay = igHandle ? `@${igHandle}` : '[INSTAGRAM LINK]'
  const location = profile.address || '[LOCATION OR AREA SERVED]'

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrors({})

    const result = await contactService.sendMessage({
      name: fullName,
      email,
      message,
    })

    if (result.ok) {
      setStatus('success')
      setDeliveryNote(
        result.delivery === 'queued'
          ? 'Backend is offline — your message is saved locally and will be delivered when the service is back up.'
          : null,
      )
      setFullName('')
      setEmail('')
      setMessage('')
    } else {
      setStatus('error')
      setErrors(result.errors || {})
    }
  }

  function startOver() {
    setStatus('idle')
    setDeliveryNote(null)
  }

  return (
    <div className="cre-shell">
      {/* ---------- Nav (same as Home) ---------- */}
      <nav className="cre-nav" aria-label="Primary">
        <Link to="/home" className="cre-brand">{studioName}</Link>
        <div className="cre-nav-pill">
          <NavLink to="/home" end className={({ isActive }) => `cre-nav-link${isActive ? ' is-active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => `cre-nav-link${isActive ? ' is-active' : ''}`}>
            Service
          </NavLink>
          <NavLink to="/packages" className={({ isActive }) => `cre-nav-link${isActive ? ' is-active' : ''}`}>
            Projects
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `cre-nav-link${isActive ? ' is-active' : ''}`}>
            Contact Us
          </NavLink>
        </div>
        <Link to="/packages" className="cre-cta" aria-label="Book a call">
          Book a Call
          <span aria-hidden="true" className="cre-cta-arrow">↗</span>
        </Link>
      </nav>

      {/* ---------- Contact section ---------- */}
      <main className="cre-contact-page" aria-labelledby="contact-head">
        <header className="cre-contact-head">
          <p className="cre-eyebrow"><span className="cre-eyebrow-num">(03)</span> Contact</p>
          <h1 id="contact-head" className="cre-contact-title">Get in touch.</h1>
          <p className="cre-contact-intro">
            Tell me about your shoot &mdash; I usually reply within 48 hours.
          </p>
        </header>

        <div className="cre-contact-grid">
          {/* ----- Contact details (left) ----- */}
          <aside className="cre-contact-info" aria-label="Contact details">
            <h2 className="cre-contact-info-head">Direct lines</h2>
            <dl className="cre-contact-dl">
              <div>
                <dt>Email</dt>
                <dd>
                  {profile.email
                    ? <a href={`mailto:${profile.email}`}>{emailAddr}</a>
                    : <span className="cre-contact-placeholder">{emailAddr}</span>}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {profile.phone
                    ? <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{phoneDisplay}</a>
                    : <span className="cre-contact-placeholder">{phoneDisplay}</span>}
                </dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  {waHref
                    ? <a href={waHref} target="_blank" rel="noopener noreferrer">{waDisplay}</a>
                    : <span className="cre-contact-placeholder">{waDisplay}</span>}
                </dd>
              </div>
              <div>
                <dt>Instagram</dt>
                <dd>
                  {igHref
                    ? <a href={igHref} target="_blank" rel="noopener noreferrer">{igDisplay}</a>
                    : <span className="cre-contact-placeholder">{igDisplay}</span>}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{profile.address
                    ? location
                    : <span className="cre-contact-placeholder">{location}</span>}</dd>
              </div>
            </dl>

            <div className="cre-contact-booknow">
              <p>Ready to book your shoot?</p>
              <Link to="/packages" className="cre-cta">
                Book now
                <span aria-hidden="true" className="cre-cta-arrow">↗</span>
              </Link>
            </div>
          </aside>

          {/* ----- Contact form (right) ----- */}
          <section className="cre-contact-form-wrap" aria-labelledby="form-head">
            {status === 'success' ? (
              <div className="cre-contact-success" role="status">
                <h2
                  id="success-head"
                  ref={successHeadingRef}
                  tabIndex="-1"
                  className="cre-contact-success-title"
                >
                  Message sent &mdash; thank you.
                </h2>
                <p>
                  I&rsquo;ll reply from <strong>{profile.email || '[EMAIL]'}</strong> within 48 hours.
                </p>
                {deliveryNote && <p className="cre-contact-success-note">{deliveryNote}</p>}
                <div className="cre-contact-success-actions">
                  <button type="button" className="cre-cta" onClick={startOver}>
                    Send another
                    <span aria-hidden="true" className="cre-cta-arrow">↗</span>
                  </button>
                  <Link to="/home" className="cre-nav-link cre-nav-link--inline">
                    Back to home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 id="form-head" className="cre-contact-form-head">Send a message</h2>

                {errors.form && (
                  <p className="cre-form-error cre-form-error--banner" role="alert">
                    {errors.form}
                  </p>
                )}
                {status === 'error' && !errors.form && (
                  <p className="cre-form-error cre-form-error--banner" role="alert">
                    I couldn&rsquo;t send that just now. Please check the fields and try again.
                  </p>
                )}

                <form className="cre-contact-form" noValidate onSubmit={handleSubmit}>
                  <div className="cre-form-field">
                    <label htmlFor="contact-name" className="cre-form-label">
                      Name <span className="cre-form-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-name"
                      className={`cre-form-input${errors.name ? ' is-error' : ''}`}
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'contact-name-err' : undefined}
                    />
                    {errors.name && (
                      <p id="contact-name-err" className="cre-form-error">{errors.name}</p>
                    )}
                  </div>

                  <div className="cre-form-field">
                    <label htmlFor="contact-email" className="cre-form-label">
                      Email <span className="cre-form-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-email"
                      className={`cre-form-input${errors.email ? ' is-error' : ''}`}
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'contact-email-err' : undefined}
                    />
                    {errors.email && (
                      <p id="contact-email-err" className="cre-form-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="cre-form-field">
                    <label htmlFor="contact-message" className="cre-form-label">
                      Message <span className="cre-form-required" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      className={`cre-form-textarea${errors.message ? ' is-error' : ''}`}
                      name="message"
                      required
                      rows="6"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      aria-invalid={errors.message ? 'true' : 'false'}
                      aria-describedby={errors.message ? 'contact-message-err' : undefined}
                    />
                    {errors.message && (
                      <p id="contact-message-err" className="cre-form-error">{errors.message}</p>
                    )}
                  </div>

                  <div className="cre-form-actions">
                    <button
                      type="submit"
                      className="cre-cta"
                      disabled={status === 'submitting'}
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send'}
                      <span aria-hidden="true" className="cre-cta-arrow">↗</span>
                    </button>
                    <p className="cre-form-required-note">Fields marked * are required.</p>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>

      {/* ---------- Footer (same as Home) ---------- */}
      <footer className="cre-footer" role="contentinfo">
        <div className="cre-footer-top">
          <div className="cre-footer-brand">
            <h2>{studioName}</h2>
            <p>Photography across Accra and beyond. Available for weddings, portraits, events, and editorial commissions.</p>
            <Link to="/packages" className="cre-cta" aria-label="Book a call from the footer">
              Book a Call
              <span aria-hidden="true" className="cre-cta-arrow">↗</span>
            </Link>
          </div>
          <nav className="cre-footer-col" aria-label="Site">
            <h3>Site</h3>
            <ul>
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/packages">Packages</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </nav>
          <div className="cre-footer-col">
            <h3>Contact</h3>
            <ul>
              {profile.phone && <li><a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a></li>}
              {profile.email && <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>}
              {profile.address && <li>{profile.address}</li>}
            </ul>
          </div>
        </div>
        <div className="cre-footer-bottom">
          <p>© {new Date().getFullYear()} {studioName}. All rights reserved.</p>
          <p>Accra &middot; Ghana</p>
        </div>
      </footer>
    </div>
  )
}
