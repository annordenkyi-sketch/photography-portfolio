import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import {
  PORTFOLIO_CATEGORIES,
  normalizeSlug,
  slugToLabel,
} from '../data/portfolioCategories.js'
import { useStudioProfile } from '../hooks/useStudioProfile.js'
import Lightbox from '../components/Lightbox.jsx'
import PublicNav from '../components/PublicNav.jsx'
import PublicFooter from '../components/PublicFooter.jsx'

// /portfolio — editorial layout:
//   menu over a full-width hero (big see-through category title +
//   breadcrumb) → sticky category bar → uniform 4:5 photo grid →
//   "Like what you see?" band → footer.
// The hero photo, title and breadcrumb follow the active category.
// ?category=<slug> links (e.g. /portfolio?category=wedding) stay valid.
//
// Motion (CSS: "PORTFOLIO MOTION" in index.css; all off under reduced
// motion):
// - Entrance: hero photo fades in with a slow settle, then the title,
//   breadcrumb, category bar and photos follow with a short stagger.
//   (The page-to-page fade lives in hooks/usePageTransition.js.)
// - Browsing: switching category crossfades the hero photo, re-plays the
//   title, slides the tab underline across, and staggers the new photos
//   in. Photos further down fade up as they scroll into view. The viewer
//   fades open and each photo fades in when you page through.

// Entrance delays (ms) for the first visit; after that, category
// switches use short delays so browsing feels quick.
const ENTRANCE = { title: 180, crumbs: 300, tabs: 420, photos: 540 }
const BROWSE = { title: 0, crumbs: 90 }
const PHOTO_STEP = 70 // gap between photos appearing together
const PHOTO_STEP_CAP = 8 // never wait longer than 8 steps

// Preferred hero photo per category (falls back to the first photo in
// that category if one is hidden or removed in Admin).
const HERO_PICK = {
  all: 'seed_6',
  wedding: 'seed_5',
  portrait: 'seed_9',
  event: 'seed_16',
  landscape: 'seed_17',
}

// Unsplash CDN images can be re-sized on request; uploaded photos (blob:
// URLs) are used as-is.
function sized(url, w, h) {
  if (!url || !url.includes('images.unsplash.com')) return url
  const u = new URL(url)
  u.searchParams.set('w', String(w))
  if (h) u.searchParams.set('h', String(h))
  else u.searchParams.delete('h')
  u.searchParams.set('fit', 'crop')
  u.searchParams.set('fm', 'webp')
  u.searchParams.set('q', '80')
  return u.toString()
}
const isResizable = (url) => Boolean(url && url.includes('images.unsplash.com'))

export default function Portfolio() {
  const profile = useStudioProfile()
  const studioName = profile.name || 'Perry Studios'
  const [allPhotos, setAllPhotos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [searchParams] = useSearchParams()
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // First-visit entrance vs. later browsing.
  const mountedAt = useRef(performance.now())
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1200)
    return () => clearTimeout(t)
  }, [])
  const delays = entered ? BROWSE : ENTRANCE

  const activeSlug = normalizeSlug(searchParams.get('category'))
  const activeLabel = slugToLabel(activeSlug) || 'All'
  const heroTitle = activeSlug === 'all' ? 'Portfolio' : activeLabel

  // Browser tab title follows the category; restored when leaving.
  useEffect(() => {
    const prev = document.title
    document.title = activeSlug === 'all'
      ? `Portfolio · ${studioName}`
      : `${activeLabel} · Portfolio · ${studioName}`
    return () => { document.title = prev }
  }, [activeSlug, activeLabel, studioName])

  // Close the viewer when the category changes.
  useEffect(() => { setLightboxIndex(null) }, [activeSlug])

  useEffect(() => {
    let cancelled = false
    const revokes = []
    async function load() {
      const items = []
      for (const p of portfolio.listPublicPhotos()) {
        const src = await portfolio.resolveFullUrl(p)
        if (!src) continue
        if (src.startsWith('blob:')) revokes.push(src)
        items.push({ ...p, resolvedSrc: src })
      }
      if (!cancelled) {
        setAllPhotos(items)
        setLoaded(true)
      }
    }
    load()
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [])

  const photos = useMemo(() => {
    if (activeSlug === 'all') return allPhotos
    return allPhotos.filter((p) => (p.category || '').toLowerCase() === activeLabel.toLowerCase())
  }, [allPhotos, activeSlug, activeLabel])

  const heroPhoto = useMemo(() => {
    const pool = activeSlug === 'all' ? allPhotos : photos
    return pool.find((p) => p.id === HERO_PICK[activeSlug]) || pool[0] || allPhotos[0] || null
  }, [allPhotos, photos, activeSlug])

  // Fade photos up as they scroll into view. The grid is re-keyed per
  // category, so a switch re-plays this for the new set. Photos that come
  // into view together appear one after another (PHOTO_STEP apart); on the
  // first visit they wait until the title and tabs have arrived.
  useEffect(() => {
    const els = document.querySelectorAll('.pf-reveal:not(.is-visible)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      const sinceMount = performance.now() - mountedAt.current
      const base = Math.max(0, ENTRANCE.photos - sinceMount)
      let step = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        el.style.transitionDelay = `${Math.round(base + Math.min(step, PHOTO_STEP_CAP) * PHOTO_STEP)}ms`
        el.classList.add('is-visible')
        io.unobserve(el)
        step += 1
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [photos, activeSlug])

  // Hero photo crossfade: the previous photo stays underneath while the
  // new one fades in on top.
  const [heroLayers, setHeroLayers] = useState({ prev: null, cur: null })
  const heroSrcValue = heroPhoto ? heroPhoto.resolvedSrc : null
  useEffect(() => {
    if (!heroSrcValue) return
    setHeroLayers((l) => (l.cur === heroSrcValue ? l : { prev: l.cur, cur: heroSrcValue }))
  }, [heroSrcValue])

  // Sliding underline under the active category tab.
  const tabsListRef = useRef(null)
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState(null)
  useLayoutEffect(() => {
    const list = tabsListRef.current
    if (!list) return undefined
    function measure() {
      const el = tabRefs.current[activeSlug]
      if (!el) return
      setIndicator({
        x: el.offsetLeft,
        y: el.offsetTop + el.offsetHeight - 2,
        w: el.offsetWidth,
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [activeSlug])

  const lightboxItems = useMemo(
    () => photos.map((p) => ({
      src: sized(p.resolvedSrc, 2000),
      alt: photoAlt(p),
      title: p.title,
      category: p.category,
    })),
    [photos],
  )

  const heroImg = (src, extraClass, priority) => (
    <img
      key={src}
      className={`pf-hero-img${extraClass ? ` ${extraClass}` : ''}`}
      src={sized(src, 1920)}
      srcSet={isResizable(src)
        ? [960, 1440, 1920, 2400].map((w) => `${sized(src, w)} ${w}w`).join(', ')
        : undefined}
      sizes="100vw"
      width="1920"
      height="1080"
      alt=""
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )

  return (
    <div className="xoon-shell" id="top">
      <a href="#main" className="xoon-skip">Skip to content</a>

      <PublicNav band />

      {/* ---------- Hero ---------- */}
      <header className="pf-hero">
        {heroLayers.prev && heroImg(heroLayers.prev, '', false)}
        {heroLayers.cur && heroImg(heroLayers.cur, 'pf-hero-img--in', true)}
        <div className="pf-hero-scrim" aria-hidden="true" />
        <div className="pf-hero-content">
          <h1
            key={`t-${heroTitle}`}
            className="pf-hero-title pf-in"
            style={{ '--pf-delay': `${delays.title}ms` }}
          >
            {heroTitle}
          </h1>
          <nav aria-label="Breadcrumb">
            <ol
              key={`c-${activeSlug}`}
              className="pf-crumbs pf-in"
              style={{ '--pf-delay': `${delays.crumbs}ms` }}
            >
              <li><Link to="/home">Home</Link></li>
              {activeSlug === 'all' ? (
                <li aria-current="page">Portfolio</li>
              ) : (
                <>
                  <li><Link to="/portfolio">Portfolio</Link></li>
                  <li aria-current="page">{activeLabel}</li>
                </>
              )}
            </ol>
          </nav>
        </div>
      </header>

      {/* ---------- Category bar ---------- */}
      <nav
        className="pf-tabs pf-in"
        aria-label="Portfolio categories"
        style={{ '--pf-delay': `${ENTRANCE.tabs}ms` }}
      >
        <ul className="pf-tabs-list" ref={tabsListRef}>
          {indicator && (
            <li
              className="pf-tabs-indicator"
              aria-hidden="true"
              style={{
                width: `${indicator.w}px`,
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
              }}
            />
          )}
          {PORTFOLIO_CATEGORIES.map((cat) => {
            const isActive = cat.slug === activeSlug
            return (
              <li key={cat.slug}>
                <Link
                  ref={(el) => { tabRefs.current[cat.slug] = el }}
                  to={cat.slug === 'all' ? '/portfolio' : `/portfolio?category=${cat.slug}`}
                  className={`pf-tab${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {cat.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <main id="main" className="pf-main">
        {/* ---------- Photo grid ---------- */}
        {!loaded ? null : photos.length === 0 ? (
          <div className="pf-empty" role="status">
            <p>No photos in this category yet.</p>
            <Link to="/portfolio" className="xoon-text-link">See all work →</Link>
          </div>
        ) : (
          <ul key={activeSlug} className="pf-grid" aria-label={`${heroTitle} photos`}>
            {photos.map((p, i) => (
              <li key={p.id} className="pf-reveal">
                <button
                  type="button"
                  className="pf-tile"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Open “${p.title || p.category}” full size`}
                >
                  <img
                    src={sized(p.resolvedSrc, 800, 1000)}
                    srcSet={isResizable(p.resolvedSrc)
                      ? [480, 800, 1200].map((w) => `${sized(p.resolvedSrc, w, Math.round(w * 1.25))} ${w}w`).join(', ')
                      : undefined}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    alt={photoAlt(p)}
                    width="800"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="pf-tile-caption" aria-hidden="true">
                    <span className="pf-tile-cat">{p.category}</span>
                    <span className="pf-tile-title">{p.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ---------- Call to action ---------- */}
        <section className="pf-cta" aria-labelledby="pf-cta-head">
          <h2 id="pf-cta-head" className="xoon-heading">Like what you see?</h2>
          <Link to="/packages" className="xoon-btn">Book a Session</Link>
        </section>
      </main>

      <PublicFooter />

      {lightboxIndex != null && lightboxItems.length > 0 && (
        <Lightbox
          items={lightboxItems}
          startIndex={Math.min(lightboxIndex, lightboxItems.length - 1)}
          onClose={() => setLightboxIndex(null)}
          className="lightbox--animated"
        />
      )}
    </div>
  )
}

// Alt text: title plus caption where they add detail.
function photoAlt(p) {
  const parts = [p.title, p.caption].filter(Boolean)
  return parts.length ? parts.join(' — ') : `${p.category} photo`
}
