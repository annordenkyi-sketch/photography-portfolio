import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { packages as localPackages } from '../data/packages.js'

// Cover slideshow photos. 1–4 URLs; replace with the photographer's own
// shots when ready. Each entry carries a srcset with phone/tablet/desktop
// widths so the browser only downloads the size it actually needs.
// First image loads eagerly with fetchPriority="high"; the rest lazy.
const COVER_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1623610641251-a3252bea79f6?w=1920&q=80&fm=webp&auto=format&fit=crop',
    srcSet: [
      'https://images.unsplash.com/photo-1623610641251-a3252bea79f6?w=800&q=78&fm=webp&auto=format&fit=crop 800w',
      'https://images.unsplash.com/photo-1623610641251-a3252bea79f6?w=1200&q=80&fm=webp&auto=format&fit=crop 1200w',
      'https://images.unsplash.com/photo-1623610641251-a3252bea79f6?w=1920&q=80&fm=webp&auto=format&fit=crop 1920w',
    ].join(', '),
  },
  {
    src: 'https://images.unsplash.com/photo-1697059354929-731142fe2515?w=1920&q=80&fm=webp&auto=format&fit=crop',
    srcSet: [
      'https://images.unsplash.com/photo-1697059354929-731142fe2515?w=800&q=78&fm=webp&auto=format&fit=crop 800w',
      'https://images.unsplash.com/photo-1697059354929-731142fe2515?w=1200&q=80&fm=webp&auto=format&fit=crop 1200w',
      'https://images.unsplash.com/photo-1697059354929-731142fe2515?w=1920&q=80&fm=webp&auto=format&fit=crop 1920w',
    ].join(', '),
  },
  {
    src: 'https://images.unsplash.com/photo-1776153381006-043d50ab44eb?w=1920&q=80&fm=webp&auto=format&fit=crop',
    srcSet: [
      'https://images.unsplash.com/photo-1776153381006-043d50ab44eb?w=800&q=78&fm=webp&auto=format&fit=crop 800w',
      'https://images.unsplash.com/photo-1776153381006-043d50ab44eb?w=1200&q=80&fm=webp&auto=format&fit=crop 1200w',
      'https://images.unsplash.com/photo-1776153381006-043d50ab44eb?w=1920&q=80&fm=webp&auto=format&fit=crop 1920w',
    ].join(', '),
  },
]

// FAQ copy with explicit placeholders — swap in the real content later.
const FAQ_ITEMS = [
  {
    q: 'What is the deposit policy?',
    a: '[DEPOSIT POLICY — e.g. 30% up front holds the date; balance due on shoot day.]',
  },
  {
    q: 'Can I reschedule?',
    a: '[RESCHEDULING POLICY — e.g. one free reschedule with 7+ days notice; otherwise a small admin fee.]',
  },
  {
    q: 'How long until I get my photos?',
    a: '[DELIVERY TIMELINE — e.g. a sneak-peek within 48 hours; full edited gallery within 2–3 weeks.]',
  },
]

// /packages — Back to home → heading + intro → 3 package cards (3-col
// desktop, 1-col phone) → FAQ accordion → custom-request contact line.
// Package data: tries GET /api/packages first (planned Go backend), falls
// back to the local src/data/packages.js snapshot during the demo phase.
export default function Packages() {
  const [packages, setPackages] = useState(localPackages)
  const [coverIndex, setCoverIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/packages')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data) && data.length > 0) setPackages(data)
      })
      .catch(() => { /* keep local snapshot */ })
    return () => { cancelled = true }
  }, [])

  // Track prefers-reduced-motion for the cover slideshow.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  // Cover slideshow: crossfade to the next photo every 6s. Pauses when
  // the browser tab is hidden (Page Visibility API). Reduced-motion
  // callers see the first photo only, no interval.
  useEffect(() => {
    if (reducedMotion) return undefined
    if (COVER_PHOTOS.length < 2) return undefined
    let timerId = null
    function tick() {
      setCoverIndex((i) => (i + 1) % COVER_PHOTOS.length)
    }
    function start() {
      if (timerId != null) return
      timerId = window.setInterval(tick, 6000)
    }
    function stop() {
      if (timerId != null) {
        window.clearInterval(timerId)
        timerId = null
      }
    }
    function onVisibility() {
      if (document.hidden) stop(); else start()
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  return (
    <main className="packages-page">
      <section className="packages-cover" aria-label="Packages cover">
        <div className="packages-cover-images">
          {COVER_PHOTOS.map((photo, i) => (
            <img
              key={photo.src}
              className={`packages-cover-img${i === coverIndex ? ' is-active' : ''}`}
              src={photo.src}
              srcSet={photo.srcSet}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              draggable="false"
            />
          ))}
        </div>
        <div className="packages-cover-overlay" aria-hidden="true" />
        <div className="packages-cover-content">
          <a
            href="/"
            className="back-link back-link--on-cover"
            aria-label="Back to home"
          >
            <span className="back-link-arrow" aria-hidden="true">←</span>
            <span>Back to home</span>
          </a>
          <h1 className="packages-cover-title">Packages</h1>
          <p className="packages-cover-intro">
            Pick a package, book a date, and I&rsquo;ll be in touch within 48
            hours to lock in the details.
          </p>
        </div>
      </section>

      <ul className="packages-grid">
        {packages.map((pkg) => (
          <li
            key={pkg.id}
            className={`package-card${pkg.featured ? ' is-featured' : ''}`}
          >
            {pkg.featured && (
              <span className="package-badge-most-popular">Most popular</span>
            )}
            <h2>{pkg.name}</h2>
            <p className="package-price">
              <span className="package-price-value">{pkg.price}</span>
              <span className="package-price-note">
                Deposit {pkg.deposit || '[DEPOSIT AMOUNT]'}
              </span>
            </p>
            <p className="package-duration">{pkg.duration}</p>
            <ul className="package-features">
              {pkg.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link
              to={`/book?package=${pkg.id}`}
              className="btn btn-primary package-book-btn"
              aria-label={`Book the ${pkg.name} package`}
            >
              Book this package
            </Link>
          </li>
        ))}
      </ul>

      <section className="packages-faq" aria-labelledby="faq-head">
        <h2 id="faq-head">Frequently asked</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="packages-custom" aria-label="Custom requests">
        <p>
          Need something different?{' '}
          <Link to="/contact">Get in touch for a custom quote</Link>.
        </p>
      </section>
    </main>
  )
}
