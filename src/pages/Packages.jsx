import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { packages as localPackages } from '../data/packages.js'
import * as portfolio from '../services/portfolioService.js'
import BookingModal from '../components/BookingModal.jsx'
import PublicNav from '../components/PublicNav.jsx'
import PublicFooter from '../components/PublicFooter.jsx'

// /packages — layout after the reference: big centred heading + intro →
// ruled section heading → one split row per package (photo on one side,
// details on the other, alternating) → custom-quote line → footer.
// Clicking a package (card or its button) opens the booking pop-up.
//
// Motion reuses the Portfolio setup (same easing, 560ms rise, 18px):
// - Entrance: heading + intro rise in, then the package rows one after
//   another (90ms apart) as they come into view.
// - Rows: hover lift + soft shadow, photo zooms to 1.04, button fills;
//   features fade in one by one and the price counts up when a row comes
//   into view; the "Most popular" badge has a slow shimmer.
// - Press: small scale-down on the card / button.
// CSS: "PACKAGES MOTION" in index.css. Reduced motion keeps fades only.
//
// Package data: tries GET /api/packages first (planned Go backend), falls
// back to src/data/packages.js during the demo phase.

// Card photos come from the Portfolio (same data as the Portfolio page
// and admin). Each package names one photo (`portfolioPhotoId` in
// src/data/packages.js); if that photo is hidden or deleted in Admin →
// Portfolio, the first public photo in the package's category is used.
// A package with `photoSubject` (e.g. 'graduation') only
// uses photos tagged with that subject. Up to 3 more photos show as
// thumbnails, preferring ones no other card shows.
const MAX_THUMBS = 3

// Unsplash CDN images are re-sized/cropped on request (WebP, exact 4:3);
// uploaded photos (blob: URLs) are used as-is.
function sized(url, w, h) {
  if (!url || !url.includes('images.unsplash.com')) return url
  const u = new URL(url)
  u.searchParams.set('w', String(w))
  u.searchParams.set('h', String(h))
  u.searchParams.set('fit', 'crop')
  u.searchParams.set('fm', 'webp')
  u.searchParams.set('q', '80')
  return u.toString()
}
const isResizable = (url) => Boolean(url && url.includes('images.unsplash.com'))
const photoAlt = (p) => [p.title, p.caption].filter(Boolean).join(' — ') || `${p.category} photo`

const ENTRANCE_CARDS_MS = 340 // rows start after the heading + intro
const CARD_STEP_MS = 90

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function Packages() {
  const [packages, setPackages] = useState(localPackages)
  const [booking, setBooking] = useState(null) // { pkg, origin, photo }
  const triggerRef = useRef(null)
  const mountedAt = useRef(performance.now())

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

  useEffect(() => {
    const prev = document.title
    document.title = 'Packages · Perry Studios'
    return () => { document.title = prev }
  }, [])

  // Resolve each package's Portfolio photo + same-category thumbnails.
  const [photos, setPhotos] = useState({}) // pkg.id -> { main, thumbs }
  useEffect(() => {
    let cancelled = false
    const revokes = []
    async function resolve(p) {
      const src = await portfolio.resolveFullUrl(p)
      if (!src) return null
      if (src.startsWith('blob:')) revokes.push(src)
      return { id: p.id, src, alt: photoAlt(p) }
    }
    async function load() {
      const visible = portfolio.listPublicPhotos()
      // Subjects a package claims (e.g. 'graduation'): those photos are
      // only used on that package, never on others in the same category.
      const claimed = new Set(packages.map((k) => k.photoSubject).filter(Boolean))
      // Main photos first, so thumbnails avoid repeating another card's main.
      const used = new Set(packages.map((k) => k.portfolioPhotoId))
      const next = {}
      for (const pkg of packages) {
        const cat = (pkg.category || '').toLowerCase()
        const pool = visible.filter((p) => (p.category || '').toLowerCase() === cat
          && (pkg.photoSubject ? p.subject === pkg.photoSubject : !claimed.has(p.subject)))
        const linked = pool.find((p) => p.id === pkg.portfolioPhotoId) || pool[0]
          || (pkg.photoSubject ? null : visible[0])
        const kind = pkg.photoSubject
          ? pkg.photoSubject.charAt(0).toUpperCase() + pkg.photoSubject.slice(1)
          : pkg.category
        const mainAlt = `${kind} photography package — ${pkg.name}`
        let main = null
        // A replacement uploaded in Admin → Portfolio → Website images wins.
        const slotKey = portfolio.packageImageSlotKey(pkg.id)
        if (portfolio.isSiteImageCustomized(slotKey)) {
          const src = await portfolio.getSiteImageUrl(slotKey)
          if (src) {
            if (src.startsWith('blob:')) revokes.push(src)
            main = { id: slotKey, src, alt: mainAlt }
          }
        }
        if (!main && linked) {
          const r = await resolve(linked)
          if (r) main = { ...r, alt: mainAlt }
        }
        // Thumbnails: same pool; photos no other card shows come first.
        const candidates = pool.filter((p) => p.id !== linked?.id)
        candidates.sort((x, y) => Number(used.has(x.id)) - Number(used.has(y.id)))
        const thumbs = []
        for (const p of candidates) {
          if (thumbs.length >= MAX_THUMBS) break
          const t = await resolve(p)
          if (t) { thumbs.push(t); used.add(p.id) }
        }
        next[pkg.id] = { main, thumbs }
      }
      if (!cancelled) setPhotos(next)
    }
    load()
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [packages])

  // Rows rise in as they enter the view. Rows arriving together appear
  // 90ms apart; on first load they wait for the heading + intro.
  useEffect(() => {
    const els = document.querySelectorAll('.pk-reveal:not(.is-visible)')
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      const base = Math.max(0, ENTRANCE_CARDS_MS - (performance.now() - mountedAt.current))
      let step = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.style.setProperty('--pk-delay', `${Math.round(base + Math.min(step, 6) * CARD_STEP_MS)}ms`)
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
        step += 1
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [packages])

  const openBooking = useCallback((pkg, cardEl, buttonEl, photo) => {
    triggerRef.current = buttonEl
    const r = cardEl.getBoundingClientRect()
    setBooking({ pkg, photo, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  }, [])

  const closeBooking = useCallback(() => {
    setBooking(null)
    // The dialog hands focus back on close; this covers clicks on the
    // card body (not a focusable element) and older browsers.
    const btn = triggerRef.current
    requestAnimationFrame(() => btn?.focus({ preventScroll: true }))
  }, [])

  return (
    <div className="xoon-shell" id="top">
      <a href="#main" className="xoon-skip">Skip to content</a>
      <PublicNav band />

      <main id="main" className="pk-main">
        <header className="pk-head">
          <h1 className="pk-title pk-in" style={{ '--pk-delay': '80ms' }}>Packages</h1>
          <p className="pk-intro pk-in" style={{ '--pk-delay': '180ms' }}>
            Pick a package, book a date, and I&rsquo;ll be in touch within 48
            hours to lock in the details.
          </p>
        </header>

        <section className="pk-section" aria-labelledby="pk-sessions-head">
          <div className="pk-section-head pk-in" style={{ '--pk-delay': '260ms' }}>
            <h2 id="pk-sessions-head">Sessions</h2>
            <p>From a one-hour portrait session to full-day wedding coverage.</p>
          </div>

          <ul className="pk-list">
            {packages.map((pkg, i) => (
              <PackageRow
                key={pkg.id}
                pkg={pkg}
                photos={photos[pkg.id]}
                flip={i % 2 === 1}
                onBook={openBooking}
              />
            ))}
          </ul>
        </section>

        <p className="pk-custom">
          Need something different?{' '}
          <Link to="/contact">Get in touch for a custom quote</Link>.
        </p>
      </main>

      <PublicFooter />

      {booking && (
        <BookingModal
          pkg={booking.pkg}
          origin={booking.origin}
          photo={booking.photo}
          onClose={closeBooking}
        />
      )}
    </div>
  )
}

function PackageRow({ pkg, photos, flip, onBook }) {
  const cardRef = useRef(null)
  const buttonRef = useRef(null)
  const rowRef = useRef(null)
  const [inView, setInView] = useState(false)
  const main = photos?.main || null
  const thumbs = photos?.thumbs || []

  // Features + price animate once the row is in view.
  useEffect(() => {
    const el = rowRef.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return undefined }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const open = () => onBook(pkg, cardRef.current, buttonRef.current, main)

  // The <li>'s className must stay fixed: the page's scroll reveal adds
  // .is-visible to it directly, and a changing className would wipe that
  // (this hid every package card). "In view" is a data attribute instead.
  return (
    <li ref={rowRef} className="pk-reveal" data-inview={inView || undefined}>
      {/* The whole card opens the booking pop-up on click; keyboard and
          screen-reader users use the button inside it. */}
      <article
        ref={cardRef}
        className={`pk-card${flip ? ' is-flipped' : ''}${pkg.featured ? ' is-featured' : ''}`}
        aria-labelledby={`pk-name-${pkg.id}`}
        onClick={(e) => { if (!e.target.closest('button')) open() }}
      >
        <div className="pk-media">
          <PhotoFrame photo={main} className="pk-photo" w={1200} sizes="(min-width: 860px) 50vw, 100vw" />
          {thumbs.length > 0 && (
            <ul className="pk-thumbs" aria-label={`More ${pkg.category.toLowerCase()} photos`}>
              {thumbs.map((t) => (
                <li key={t.id}>
                  <PhotoFrame photo={t} className="pk-thumb" w={360} sizes="(min-width: 860px) 16vw, 33vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pk-body">
          {pkg.featured && <span className="pk-badge">Most popular</span>}
          <h3 id={`pk-name-${pkg.id}`} className="pk-name">{pkg.name}</h3>
          {pkg.description && <p className="pk-desc">{pkg.description}</p>}
          <p className="pk-price">
            <CountUp text={`From ${pkg.price}`} active={inView} />
          </p>
          <p className="pk-meta">
            <span>{pkg.duration}</span>
            {pkg.editedPhotos != null && <span>{pkg.editedPhotos} edited photos</span>}
          </p>
          <ul className="pk-features">
            {pkg.features.map((feature, i) => (
              <li key={feature} style={{ '--i': i }}>{feature}</li>
            ))}
          </ul>
          <p className="pk-deposit">
            {pkg.depositPercent ? `${pkg.depositPercent}% deposit (${pkg.deposit}) to confirm your date` : `Deposit ${pkg.deposit} to confirm your date`}
          </p>
          <button
            ref={buttonRef}
            type="button"
            className="pk-book"
            onClick={open}
            aria-haspopup="dialog"
            aria-label={`Book the ${pkg.name} package`}
          >
            <span className="pk-book-label">Book this package</span>
            <span className="pk-book-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    </li>
  )
}

// Fixed 4:3 frame with a soft colour behind the photo, so a slow or
// failed image never leaves a gap; with no photo (or a failed one) it
// shows a camera icon. Unsplash photos get a WebP srcset.
function PhotoFrame({ photo, className, w, sizes }) {
  const [failed, setFailed] = useState(false)
  const h = Math.round((w * 3) / 4)
  const showImage = photo && !failed
  return (
    <div className={`pk-frame ${className}`}>
      {!showImage && (
        <svg className="pk-frame-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
          <circle cx="12" cy="13.5" r="3.5" />
        </svg>
      )}
      {showImage && (
        <img
          src={sized(photo.src, w, h)}
          srcSet={isResizable(photo.src)
            ? [Math.round(w / 2), w].map((x) => `${sized(photo.src, x, Math.round((x * 3) / 4))} ${x}w`).join(', ')
            : undefined}
          sizes={sizes}
          alt={photo.alt}
          width={w}
          height={h}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

// Counts a price like "From GH₵ 1,500" up from 0 when `active` turns true (about
// 0.7s, ease-out). Screen readers get the final price straight away.
// Reduced motion / unparseable prices: shows the final value.
function CountUp({ text, active }) {
  const match = /^(\D*)([\d,]+)(.*)$/.exec(String(text || ''))
  const target = match ? Number(match[2].replace(/,/g, '')) : null
  const [value, setValue] = useState(target == null ? null : 0)

  useEffect(() => {
    if (target == null || !active) return undefined
    if (prefersReducedMotion()) { setValue(target); return undefined }
    let frame
    const start = performance.now()
    const duration = 700
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  if (target == null) return <span className="pk-price-value">{text}</span>
  return (
    <span className="pk-price-value">
      <span aria-hidden="true">{match[1]}{(active ? value : target).toLocaleString('en-GB')}{match[3]}</span>
      <span className="pk-sr-only">{text}</span>
    </span>
  )
}
