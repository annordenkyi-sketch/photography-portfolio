import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import {
  GALLERY_CATEGORIES,
  normalizeSlug,
  slugToLabel,
} from '../data/galleryCategories.js'
import Lightbox from '../components/Lightbox.jsx'

// /gallery page restructure (post-redesign):
//   Back to home → heading + intro → category filter → photo grid →
//   Like-what-you-see CTA. Lightbox opens on photo click. No animation.
//   Filter uses the shared GALLERY_CATEGORIES (All, Wedding, Portrait,
//   Event, Landscape); any admin-added categories still surface through
//   portfolio.getCategories() if we switch to that in a later pass.
export default function Gallery() {
  const [allPhotos, setAllPhotos] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const activeSlug = normalizeSlug(searchParams.get('category'))
  const activeLabel = slugToLabel(activeSlug) || 'All'

  const photos = useMemo(() => {
    if (activeSlug === 'all') return allPhotos
    return allPhotos.filter(
      (p) => (p.category || '').toLowerCase() === activeLabel.toLowerCase(),
    )
  }, [allPhotos, activeSlug, activeLabel])

  useEffect(() => {
    let cancelled = false
    const revokes = []
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
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [])

  function selectSlug(slug) {
    if (slug === activeSlug) return
    const next = {}
    if (slug !== 'all') next.category = slug
    setSearchParams(next)
    setLightboxIndex(null) // close viewer when category changes
  }

  const lightboxItems = useMemo(
    () => photos
      .filter((p) => p.resolvedSrc)
      .map((p) => ({
        src: p.resolvedSrc,
        alt: p.title || p.category,
        title: p.title,
        category: p.category,
      })),
    [photos],
  )

  return (
    <main className="gallery-page">
      <a href="/" className="back-link" aria-label="Back to home">
        <span className="back-link-arrow" aria-hidden="true">←</span>
        <span>Back to home</span>
      </a>

      <header className="gallery-head">
        <h1>Gallery</h1>
        <p className="gallery-intro">
          A selection of recent work across weddings, portraits, events,
          and landscapes.
        </p>
      </header>

      <div
        className="category-filter"
        role="tablist"
        aria-label="Filter photos by category"
      >
        {GALLERY_CATEGORIES.map((cat) => {
          const isActive = cat.slug === activeSlug
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`category-filter-btn${isActive ? ' is-active' : ''}`}
              onClick={() => selectSlug(cat.slug)}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {photos.length === 0 ? (
        <p className="gallery-empty" role="status">
          No photos in this category yet.
        </p>
      ) : (
        <ul className="photo-grid">
          {photos.map((p, i) => (
            <li key={p.id} className="photo-item">
              <button
                type="button"
                className="photo-item-btn"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Open ${p.title || p.category} full size`}
              >
                {p.resolvedSrc && (
                  <img
                    src={p.resolvedSrc}
                    alt={p.title || p.category}
                    loading="lazy"
                  />
                )}
                <span className="photo-item-caption">{p.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="gallery-cta" aria-label="Book a shoot">
        <p className="gallery-cta-line">Like what you see?</p>
        <Link to="/book" className="btn btn-primary">
          Book a shoot
        </Link>
      </section>

      {lightboxIndex != null && (
        <Lightbox
          items={lightboxItems}
          startIndex={Math.min(lightboxIndex, lightboxItems.length - 1)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  )
}
