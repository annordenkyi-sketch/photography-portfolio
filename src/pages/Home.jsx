import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { homeContent } from '../data/homeContent.js'
import * as portfolio from '../services/portfolioService.js'
import { useStudioProfile } from '../hooks/useStudioProfile.js'
import Lightbox from '../components/Lightbox.jsx'
import PublicNav from '../components/PublicNav.jsx'
import PublicFooter from '../components/PublicFooter.jsx'

// Landing page: hero → featured work → testimonials →
// final call to action → footer.
const unsplash = (id, w) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&fm=webp&auto=format&fit=crop`
// Bride and groom walking into a golden-hour field — Iskra Photography
// (CREDITS.md). Original is 5442×3628 (landscape), so:
// - wide screens get the full frame, up to 3200px wide for large /
//   high-density displays
// - portrait screens (phones, upright tablets) get a server-side 9:16
//   crop centred on the couple, up to 1600×2844 (inside the original's
//   3628px height, so it's never upscaled)
const HERO_ID = 'photo-1711968558574-3cdc2a947f30'
const heroWide = (w) => `https://images.unsplash.com/${HERO_ID}?w=${w}&q=80&fm=webp`
const heroTall = (w) =>
  `https://images.unsplash.com/${HERO_ID}?w=${w}&h=${Math.round((w * 16) / 9)}&fit=crop&crop=focalpoint&fp-x=0.48&fp-y=0.5&q=80&fm=webp`
const HERO_SRC = heroWide(1920)
const HERO_WIDE_SRCSET = [800, 1280, 1920, 2400, 3200].map((w) => `${heroWide(w)} ${w}w`).join(', ')
const HERO_TALL_SRCSET = [640, 960, 1280, 1600].map((w) => `${heroTall(w)} ${w}w`).join(', ')
const MAX_FEATURED = 9

// Portfolio photos on the Unsplash CDN are requested at the size they're
// shown (WebP, exact crop) instead of the full 1200px original; uploaded
// photos (blob: URLs) are used as-is.
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

function initials(name) {
  return (name || '')
    .replace(/\[PLACEHOLDER\]\s*/g, '')
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function Home() {
  // No preload() here: it can't carry a media query, so it would fetch the
  // wide crop on phones too. fetchPriority="high" on the <img> covers it.
  const heroCustomized = portfolio.isSiteImageCustomized('home_hero')

  const profile = useStudioProfile()
  const [heroUpload, setHeroUpload] = useState(null)
  const [photos, setPhotos] = useState([])
  const [featured, setFeatured] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    const revokes = []
    const track = (url) => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) revokes.push(url)
      return url
    }
    async function load() {
      if (heroCustomized) {
        const url = track(await portfolio.getSiteImageUrl('home_hero'))
        if (!cancelled && url) setHeroUpload(url)
      }
      const resolve = async (p) => ({ ...p, resolvedSrc: track(await portfolio.resolveFullUrl(p)) })
      const pubs = await Promise.all(portfolio.listPublicPhotos().map(resolve))
      const feats = await Promise.all(portfolio.listFeaturedPhotos().map(resolve))
      if (!cancelled) {
        setPhotos(pubs.filter((p) => p.resolvedSrc))
        setFeatured(feats.filter((p) => p.resolvedSrc))
      }
    }
    load()
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [heroCustomized])

  // Re-scan after photos arrive: blocks that render late must be observed too,
  // otherwise they stay at opacity 0.
  useEffect(() => {
    const els = document.querySelectorAll('.xoon-reveal:not(.is-visible)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [photos, featured])

  const studioName = profile.name || '[STUDIO NAME]'

  // Admin-featured photos first, topped up with other public photos.
  const gridPhotos = [...featured]
  for (const p of photos) {
    if (gridPhotos.length >= MAX_FEATURED) break
    if (!gridPhotos.some((g) => g.id === p.id)) gridPhotos.push(p)
  }
  const lightboxItems = gridPhotos.map((p) => ({
    src: p.resolvedSrc,
    alt: p.title || p.category,
    title: p.title,
    category: p.category,
  }))

  const ctaPhoto = photos.find((p) => p.id === 'seed_20')
    || photos.find((p) => !gridPhotos.some((g) => g.id === p.id))
    || photos[photos.length - 1]
    || null

  const testimonials = homeContent.testimonials.items
  const quote = testimonials[quoteIndex] || null
  const prevQuote = () => setQuoteIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
  const nextQuote = () => setQuoteIndex((i) => (i + 1) % testimonials.length)

  return (
    <div className="xoon-shell" id="top">
      <a href="#main" className="xoon-skip">Skip to content</a>

      <PublicNav />

      {/* ---------- Hero ---------- */}
      <header className="xoon-hero">
        {heroUpload ? (
          <img
            className="xoon-hero-img"
            src={heroUpload}
            width="1920"
            height="1280"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <picture>
            <source media="(orientation: portrait)" type="image/webp" srcSet={HERO_TALL_SRCSET} sizes="100vw" />
            <source type="image/webp" srcSet={HERO_WIDE_SRCSET} sizes="100vw" />
            <img
              className="xoon-hero-img"
              src={HERO_SRC}
              width="1920"
              height="1280"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        )}
        <div className="xoon-hero-scrim" aria-hidden="true" />
        <div className="xoon-hero-content">
          <p className="xoon-hero-eyebrow xoon-hero-anim xoon-hero-anim-1">Photography · Accra, Ghana</p>
          <h1 className="xoon-hero-title xoon-hero-anim xoon-hero-anim-2">{studioName}</h1>
          <div className="xoon-hero-actions xoon-hero-anim xoon-hero-anim-4">
            <Link to="/portfolio" className="xoon-btn xoon-btn--ghost">View Portfolio</Link>
            <Link to="/packages" className="xoon-btn">Book a Session</Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------- Featured work ---------- */}
        <section className="xoon-section" aria-labelledby="work-head">
          <header className="xoon-section-head xoon-reveal">
            <p className="xoon-eyebrow">Portfolio</p>
            <h2 id="work-head" className="xoon-heading">Featured work</h2>
          </header>
          <ul className="xoon-work-grid">
            {gridPhotos.map((p, i) => (
              <li key={p.id} className="xoon-reveal">
                <button
                  type="button"
                  className="xoon-work-tile xoon-photo"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Open ${p.title || p.category} full size`}
                >
                  <img
                    src={sized(p.resolvedSrc, 800, 1000)}
                    srcSet={isResizable(p.resolvedSrc)
                      ? [480, 800, 1200].map((w) => `${sized(p.resolvedSrc, w, Math.round(w * 1.25))} ${w}w`).join(', ')
                      : undefined}
                    sizes="(min-width: 900px) 33vw, 50vw"
                    alt={p.title || p.category}
                    width="800"
                    height="1000"
                    loading={i < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </button>
              </li>
            ))}
          </ul>
          <div className="xoon-center xoon-reveal">
            <Link to="/portfolio" className="xoon-text-link">View full portfolio →</Link>
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        {quote && (
          <section className="xoon-section xoon-section--alt" aria-labelledby="quotes-head">
            <header className="xoon-section-head xoon-reveal">
              <p className="xoon-eyebrow">Kind words</p>
              <h2 id="quotes-head" className="xoon-heading">{homeContent.testimonials.heading}</h2>
            </header>
            <figure className={`xoon-quote xoon-reveal${quote.image ? ' has-image' : ''}`}>
              {quote.image && (
                <div className="xoon-quote-media">
                  <img
                    key={quote.id}
                    src={quote.image}
                    alt={quote.imageAlt || ''}
                    width="800"
                    height="800"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="xoon-quote-body">
              <blockquote className="xoon-quote-text" aria-live="polite">
                &ldquo;{quote.quote}&rdquo;
              </blockquote>
              <figcaption className="xoon-quote-cite">
                <span className="xoon-quote-avatar" aria-hidden="true">{initials(quote.name)}</span>
                <span>
                  <span className="xoon-quote-name">{quote.name}</span>
                  <span className="xoon-quote-role">{quote.role}</span>
                </span>
              </figcaption>
              {testimonials.length > 1 && (
                <div className="xoon-quote-controls">
                  <button type="button" className="xoon-quote-arrow" onClick={prevQuote} aria-label="Previous testimonial">‹</button>
                  <div className="xoon-quote-dots" role="group" aria-label="Choose testimonial">
                    {testimonials.map((t, i) => (
                      <button
                        key={t.id || i}
                        type="button"
                        className={`xoon-quote-dot${i === quoteIndex ? ' is-active' : ''}`}
                        aria-label={`Testimonial ${i + 1} of ${testimonials.length}`}
                        aria-pressed={i === quoteIndex}
                        onClick={() => setQuoteIndex(i)}
                      />
                    ))}
                  </div>
                  <button type="button" className="xoon-quote-arrow" onClick={nextQuote} aria-label="Next testimonial">›</button>
                </div>
              )}
              </div>
            </figure>
          </section>
        )}

        {/* ---------- Final call to action ---------- */}
        <section className="xoon-cta xoon-reveal" aria-labelledby="cta-head">
          {ctaPhoto && (
            <img
              className="xoon-cta-img"
              src={sized(ctaPhoto.resolvedSrc, 1600, 900)}
              srcSet={isResizable(ctaPhoto.resolvedSrc)
                ? [960, 1600, 2200].map((w) => `${sized(ctaPhoto.resolvedSrc, w, Math.round(w * 0.5625))} ${w}w`).join(', ')
                : undefined}
              sizes="100vw"
              alt=""
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="xoon-cta-scrim" aria-hidden="true" />
          <div className="xoon-cta-content">
            <h2 id="cta-head" className="xoon-heading">Ready to book your session?</h2>
            <p className="xoon-cta-text">Pick a package and a date — I&rsquo;ll confirm within 48 hours.</p>
            <Link to="/packages" className="xoon-btn">Book a Session</Link>
          </div>
        </section>
      </main>

      <PublicFooter />

      {lightboxIndex != null && lightboxItems.length > 0 && (
        <Lightbox
          items={lightboxItems}
          startIndex={Math.min(lightboxIndex, lightboxItems.length - 1)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

