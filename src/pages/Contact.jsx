import { useEffect, useRef, useState } from 'react'
import * as studioProfile from '../services/studioProfileService.js'
import * as contactService from '../services/contactService.js'
import { useStudioProfile } from '../hooks/useStudioProfile.js'
import PublicNav from '../components/PublicNav.jsx'

// /contact — layout after the reference: a hero that fills the first
// screen (photo, big see-through title, one line of text, animated
// "Scroll down") → a narrow centred form with underline fields. The shared
// menu sits over the hero, transparent, and becomes a solid dark bar once
// the hero scrolls away (PublicNav `overHero`). No footer (the page ends
// with the form).
//
// Hero motion: the photo settles from 1.08× to 1× (1.8s), then the title,
// text and scroll cue rise in; the photo has a gentle parallax on scroll.
//
// The form posts to POST /api/contact (planned Go backend) through
// contactService; if the server is offline the message is queued in
// localStorage so the sender isn't blocked.
//
// Motion: hero title, breadcrumb and scroll cue rise in; form fields fade up as they scroll into view; field underlines glow in
// from the left on focus. CSS: CONTACT PAGE block in index.css. Reduced
// motion keeps fades only (shared --pk-rise token drops to 0).

// Hand holding a professional camera — rawkkim, Unsplash (CREDITS.md).
// Original 4000×6000 (portrait): wide screens get a 16:10 crop centred on
// the camera, portrait screens the full frame.
const HERO_ID = 'photo-1760061398084-0ec65a992725'
const heroWide = (w) =>
  `https://images.unsplash.com/${HERO_ID}?w=${w}&h=${Math.round(w * 0.625)}&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&q=80&fm=webp`
const heroTall = (w) => `https://images.unsplash.com/${HERO_ID}?w=${w}&q=80&fm=webp`
const HERO_WIDE_SRCSET = [960, 1440, 1920, 2400].map((w) => `${heroWide(w)} ${w}w`).join(', ')
const HERO_TALL_SRCSET = [640, 960, 1280, 1600].map((w) => `${heroTall(w)} ${w}w`).join(', ')
const HERO_ALT = 'A hand holding a professional camera with a large white telephoto lens'

// Same wording as contactService's checks, plus the phone number.
function validate({ name, phone, email, message }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Please enter your name.'
  if (!phone.trim()) errors.phone = 'Please enter your phone number.'
  else if (!/^\+?\d[\d\s()-]{7,}$/.test(phone.trim())) errors.phone = 'Please enter a valid number with country code, e.g. +233 20 123 4567.'
  // Email is optional (as in the booking form); checked only when given.
  if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!message.trim()) errors.message = 'Please write a short message.'
  return errors
}

const EMPTY = { name: '', phone: '', email: '', message: '' }

export default function Contact() {
  const profile = useStudioProfile()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // 'idle'|'submitting'|'success'|'error'
  const [deliveryNote, setDeliveryNote] = useState(null)
  const successHeadingRef = useRef(null)
  const heroRef = useRef(null)
  const mediaRef = useRef(null)

  // Gentle parallax: the hero photo moves at ~70% of the scroll speed
  // (shifted down by 30% of the scroll) while the hero is on screen.
  // Off under reduced motion. Transform only, one rAF per frame.
  useEffect(() => {
    const media = mediaRef.current
    const hero = heroRef.current
    if (!media || !hero) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y > hero.offsetHeight) return
      media.style.transform = `translate3d(0, ${Math.round(y * 0.3)}px, 0)`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = `Contact · ${profile.name || 'Perry Studios'}`
    return () => { document.title = prev }
  }, [profile.name])

  // Move focus into the success message when it appears.
  useEffect(() => {
    if (status === 'success') successHeadingRef.current?.focus()
  }, [status])

  // Fade elements up as they scroll into view. Re-runs when the form is
  // swapped for the success message (and back).
  useEffect(() => {
    const els = document.querySelectorAll('.ct-reveal:not(.is-visible)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      let step = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.style.setProperty('--ct-delay', `${Math.min(step, 6) * 80}ms`)
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
        step += 1
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [status])

  // The success message names the reply address only once a real email is
  // saved in Admin → Settings (the built-in default is a placeholder).
  const realEmail = studioProfile.realContact(profile).email

  function handleChange(e) {
    const { name, value } = e.target
    const next = { ...values, [name]: value }
    setValues(next)
    if (touched[name] || errors[name]) {
      const msg = validate(next)[name]
      setErrors((prev) => {
        const out = { ...prev }
        if (msg) out[name] = msg
        else delete out[name]
        return out
      })
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((t) => ({ ...t, [name]: true }))
    const msg = validate(values)[name]
    setErrors((prev) => {
      const out = { ...prev }
      if (msg) out[name] = msg
      else delete out[name]
      return out
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return
    const local = validate(values)
    setTouched({ name: true, phone: true, email: true, message: true })
    if (Object.keys(local).length) {
      setErrors(local)
      setStatus('idle')
      const first = ['name', 'phone', 'email', 'message'].find((f) => local[f])
      document.getElementById(`contact-${first}`)?.focus()
      return
    }
    setStatus('submitting')
    setErrors({})
    const result = await contactService.sendMessage({
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
    })
    if (result.ok) {
      setStatus('success')
      setDeliveryNote(
        result.delivery === 'queued'
          ? 'The message service is offline right now, so your message is saved and will be delivered as soon as it’s back.'
          : null,
      )
      setValues(EMPTY)
      setTouched({})
    } else {
      setStatus('error')
      setErrors(result.errors || {})
    }
  }

  function startOver() {
    setStatus('idle')
    setDeliveryNote(null)
  }

  const field = (name) => ({
    id: `contact-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-err` : undefined,
  })

  return (
    <div className="xoon-shell" id="top">
      <a href="#main" className="xoon-skip">Skip to content</a>
      {/* Preload the hero photo (matching variant per orientation).
          rel="preload" is allowed in <body>; browsers start the fetch as
          soon as the page renders. */}
      <link rel="preload" as="image" type="image/webp" media="(orientation: portrait)" imageSrcSet={HERO_TALL_SRCSET} imageSizes="100vw" fetchPriority="high" />
      <link rel="preload" as="image" type="image/webp" media="(orientation: landscape)" imageSrcSet={HERO_WIDE_SRCSET} imageSizes="100vw" fetchPriority="high" />

      {/* Transparent over the hero; turns into a solid bar after it. */}
      <PublicNav overHero heroRef={heroRef} />

      {/* ---------- Hero (fills the first screen) ---------- */}
      <header className="ct-hero" ref={heroRef}>
        {/* Parallax layer (moved in JS) → settle-zoom on the image (CSS) */}
        <div className="ct-hero-media" ref={mediaRef}>
          <picture>
            <source media="(orientation: portrait)" type="image/webp" srcSet={HERO_TALL_SRCSET} sizes="100vw" />
            <source type="image/webp" srcSet={HERO_WIDE_SRCSET} sizes="100vw" />
            <img
              className="ct-hero-img"
              src={heroWide(1920)}
              alt={HERO_ALT}
              width="1920"
              height="1200"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
        <div className="ct-hero-scrim" aria-hidden="true" />
        <div className="ct-hero-content">
          <h1 className="ct-hero-title ct-in" style={{ '--ct-delay': '600ms' }}>Get in touch</h1>
        </div>
        <a href="#contact-form" className="ct-scroll ct-in" style={{ '--ct-delay': '960ms' }}>
          <span className="ct-scroll-track" aria-hidden="true"><span className="ct-scroll-dot" /></span>
          <span>Scroll down</span>
        </a>
      </header>

      <main id="main" className="ct-main">
        {/* ---------- Form ---------- */}
        <section id="contact-form" className="ct-section ct-form-section" aria-labelledby="form-head">
          {status === 'success' ? (
            <div className="ct-success ct-in" role="status">
              <svg className="ct-success-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M7.5 12.5l3 3 6-6.5" />
              </svg>
              <h2 id="form-head" ref={successHeadingRef} tabIndex={-1}>Message sent &mdash; thank you.</h2>
              <p>
                I&rsquo;ll get back to you within 48 hours
                {realEmail ? <> from <strong>{realEmail}</strong></> : null}.
              </p>
              {deliveryNote && <p className="ct-note">{deliveryNote}</p>}
              <button type="button" className="ct-submit" onClick={startOver}>Send another message</button>
            </div>
          ) : (
            <>
              <div className="ct-head ct-reveal">
                <h2 id="form-head">Send a message</h2>
                <p>Fields marked * are required.</p>
              </div>

              {(errors.form || status === 'error') && (
                <p className="ct-banner" role="alert">
                  {errors.form || 'I couldn’t send that just now. Please check the fields and try again.'}
                </p>
              )}

              <form className="ct-form" noValidate onSubmit={handleSubmit}>
                <div className={`ct-field ct-reveal${errors.name ? ' has-error' : ''}`}>
                  <label htmlFor="contact-name">Your name <span aria-hidden="true">*</span></label>
                  <input type="text" autoComplete="name" placeholder="Enter your full name" {...field('name')} />
                  <span className="ct-underline" aria-hidden="true" />
                  {errors.name && <p id="contact-name-err" className="ct-error">{errors.name}</p>}
                </div>

                <div className={`ct-field ct-reveal${errors.phone ? ' has-error' : ''}`}>
                  <label htmlFor="contact-phone">Phone number <span aria-hidden="true">*</span></label>
                  <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+233 20 123 4567" {...field('phone')} />
                  <span className="ct-underline" aria-hidden="true" />
                  {errors.phone
                    ? <p id="contact-phone-err" className="ct-error">{errors.phone}</p>
                    : <p className="ct-hint">Start with your country code, e.g. +233 for Ghana.</p>}
                </div>

                <div className={`ct-field ct-reveal${errors.email ? ' has-error' : ''}`}>
                  <label htmlFor="contact-email">Email address <span className="ct-optional">(optional)</span></label>
                  <input type="email" autoComplete="email" placeholder="your.email@example.com" {...field('email')} />
                  <span className="ct-underline" aria-hidden="true" />
                  {errors.email
                    ? <p id="contact-email-err" className="ct-error">{errors.email}</p>
                    : <p className="ct-hint">Or leave it blank and I&rsquo;ll reply by phone or WhatsApp.</p>}
                </div>

                <div className={`ct-field ct-reveal${errors.message ? ' has-error' : ''}`}>
                  <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
                  <textarea rows="5" placeholder="Tell me about your shoot: the occasion, date and location." {...field('message')} />
                  <span className="ct-underline" aria-hidden="true" />
                  {errors.message && <p id="contact-message-err" className="ct-error">{errors.message}</p>}
                </div>

                <div className="ct-actions ct-reveal">
                  <button type="submit" className="ct-submit" disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
