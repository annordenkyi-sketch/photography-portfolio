import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import {
  GALLERY_CATEGORIES,
  normalizeSlug,
  slugToLabel,
} from '../data/galleryCategories.js'

// Placeholder gallery cover image. Replace with your own photo URL
// or drop a file into /public and reference it as "/gallery-hero.jpg".
const GALLERY_HERO = 'https://picsum.photos/seed/perry-gallery/1920/1080'

export default function Gallery() {
  const gridRef = useRef(null)
  const tabsRef = useRef(null)
  const [allPhotos, setAllPhotos] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()

  // URL is the source of truth for the active tab. Invalid slugs fall
  // back to 'all' so a broken shared link still shows the full gallery.
  const activeSlug = normalizeSlug(searchParams.get('category'))
  const activeLabel = slugToLabel(activeSlug) || 'All'

  const photos = useMemo(() => {
    if (activeSlug === 'all') return allPhotos
    return allPhotos.filter(
      (p) => (p.category || '').toLowerCase() === activeLabel.toLowerCase(),
    )
  }, [allPhotos, activeSlug, activeLabel])

  // Load photos from portfolioService; resolve URLs (blob or seed URL)
  useEffect(() => {
    let revokes = []
    let cancelled = false
    async function load() {
      const meta = portfolio.listPublicPhotos()
      const items = []
      for (const p of meta) {
        const src = await portfolio.resolveFullUrl(p)
        items.push({ ...p, resolvedSrc: src })
        if (src && src.startsWith('blob:')) revokes.push(src)
      }
      if (!cancelled) setAllPhotos(items)
    }
    load()
    return () => { cancelled = true; for (const u of revokes) URL.revokeObjectURL(u) }
  }, [])

  // Scroll the tabs/grid into view when the user first lands with a
  // category in the URL — so clicking a Home services card jumps past
  // the hero. We don't scroll on tab switches (feels jumpy inside the
  // page); the hero stays visible so filter context is still obvious.
  const didInitialScrollRef = useRef(false)
  useEffect(() => {
    if (didInitialScrollRef.current) return
    if (activeSlug === 'all') { didInitialScrollRef.current = true; return }
    const el = tabsRef.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    didInitialScrollRef.current = true
  }, [activeSlug])

  // Reveal animation per visible tile.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const items = grid.querySelectorAll('.gallery-item')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        visible.forEach((entry, i) => {
          const el = entry.target
          el.style.transitionDelay = `${i * 80}ms`
          el.classList.add('is-visible')
          observer.unobserve(el)
        })
      },
      { threshold: 0.15 },
    )

    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [photos])

  function selectSlug(slug) {
    if (slug === activeSlug) return
    const next = {}
    if (slug !== 'all') next.category = slug
    // Default history-push behaviour so browser Back returns to the
    // previous category (or Home, if that was the previous page).
    setSearchParams(next)
  }

  return (
    <>
      <section className="page-hero">
        <img
          className="page-hero-bg"
          src={GALLERY_HERO}
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <h1 className="reveal reveal-1">
            {activeSlug === 'all' ? 'Gallery' : activeLabel}
          </h1>
          <p className="reveal reveal-2">
            {activeSlug === 'all'
              ? 'A selection of recent work across the categories I shoot.'
              : `Filtered to ${activeLabel.toLowerCase()}.`}
          </p>
        </div>
      </section>

      <section className="container gallery">
        <nav
          ref={tabsRef}
          className="gallery-tabs"
          aria-label="Filter photos by category"
          role="tablist"
        >
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = cat.slug === activeSlug
            return (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`gallery-tab${isActive ? ' is-active' : ''}`}
                onClick={() => selectSlug(cat.slug)}
              >
                {cat.label}
              </button>
            )
          })}
        </nav>

        {photos.length === 0 ? (
          <div className="gallery-empty" role="status">
            <h2>New {activeLabel.toLowerCase()} photos coming soon</h2>
            <p>I&rsquo;m still building out this collection. In the meantime, have a look at everything else.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => selectSlug('all')}
            >
              Back to all photos
            </button>
          </div>
        ) : (
          <ul className="gallery-grid" ref={gridRef}>
            {photos.map((photo) => (
              <li key={photo.id} className="gallery-item">
                {photo.resolvedSrc && (
                  <img src={photo.resolvedSrc} alt={photo.title || photo.category} loading="lazy" />
                )}
                <span className="gallery-caption">{photo.category}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
