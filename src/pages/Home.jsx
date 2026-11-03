import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { homeContent } from '../data/homeContent.js'
import { CONTENT_CATEGORIES } from '../data/galleryCategories.js'
import * as portfolio from '../services/portfolioService.js'
import * as studioProfile from '../services/studioProfileService.js'

// CREACY-style landing page.
// 4 sections only: Nav → Hero → Category rail → Footer.
// Dark charcoal shell, white type, white chip CTAs, Manrope sans. No 3D
// effects anywhere; only standard hover/focus color changes. Styles from
// --cre-* tokens in src/index.css.
const DEFAULT_HERO = 'https://picsum.photos/seed/perry-home/1920/1080'

export default function Home() {
  const [profile, setProfile] = useState(() => studioProfile.getProfile())
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO)
  const [featured, setFeatured] = useState([])
  const [publicPhotos, setPublicPhotos] = useState([])
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const revokes = []
    async function load() {
      try {
        const url = await portfolio.getSiteImageUrl('home_hero')
        if (!cancelled && url) {
          setHeroImage(url)
          if (url.startsWith('blob:')) revokes.push(url)
        }
      } catch { /* use default */ }

      const featList = portfolio.listFeaturedPhotos().slice(0, 3)
      const feats = await Promise.all(featList.map(async (p) => {
        const url = (await portfolio.resolveThumbUrl?.(p)) ?? p.thumbSrc ?? p.src
        if (url && typeof url === 'string' && url.startsWith('blob:')) revokes.push(url)
        return { ...p, resolvedSrc: url }
      }))

      const pubList = portfolio.listPublicPhotos()
      const pubs = await Promise.all(pubList.map(async (p) => {
        const url = (await portfolio.resolveThumbUrl?.(p)) ?? p.thumbSrc ?? p.src
        if (url && typeof url === 'string' && url.startsWith('blob:')) revokes.push(url)
        return { ...p, resolvedSrc: url }
      }))

      if (!cancelled) {
        setFeatured(feats)
        setPublicPhotos(pubs)
      }
    }
    load()
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [])

  const name = profile.name || '[STUDIO NAME]'
  const tagline = profile.tagline || 'Photography across Accra and beyond.'
  const contactHref = '/contact'

  const railCategories = CONTENT_CATEGORIES.slice(0, 3)
  const railCards = railCategories.map((cat) => {
    const match = publicPhotos.find(
      (p) => (p.category || '').toLowerCase() === cat.label.toLowerCase(),
    )
    return { ...cat, image: match?.resolvedSrc || null }
  })

  const slideCount = Math.max(featured.length, 1)
  function prevSlide() { setSlideIndex((i) => (i - 1 + slideCount) % slideCount) }
  function nextSlide() { setSlideIndex((i) => (i + 1) % slideCount) }
  const paginatorFill = `${Math.round(((slideIndex + 1) / slideCount) * 100)}%`

  return (
    <div className="cre-shell">
      {/* ---------- Nav ---------- */}
      <nav className="cre-nav" aria-label="Primary">
        <Link to="/home" className="cre-brand">{name}</Link>
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
          <NavLink to={contactHref} className={({ isActive }) => `cre-nav-link${isActive ? ' is-active' : ''}`}>
            Contact Us
          </NavLink>
        </div>
        <Link to="/packages" className="cre-cta" aria-label="Book a call">
          Book a Call
          <span aria-hidden="true" className="cre-cta-arrow">↗</span>
        </Link>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="cre-hero" aria-label="Hero">
        <img
          className="cre-hero-bg"
          src={heroImage}
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="cre-hero-scrim" aria-hidden="true" />
        <div className="cre-hero-inner">
          <h1 className="cre-hero-headline">{tagline}</h1>
          <div className="cre-hero-row">
            <ul className="cre-hero-pills" aria-label="What I shoot">
              {CONTENT_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/gallery?category=${cat.slug}`} className="cre-hero-pill">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>

            {featured.length > 0 && (
              <div className="cre-hero-carousel">
                <div className="cre-hero-paginator">
                  <button
                    type="button"
                    className="cre-hero-paginator-btn"
                    onClick={prevSlide}
                    aria-label="Previous featured photo"
                  >
                    ‹
                  </button>
                  <span>{String(slideIndex + 1).padStart(2, '0')}</span>
                  <span
                    className="cre-hero-paginator-bar"
                    style={{ '--cre-paginator-fill': paginatorFill }}
                    aria-hidden="true"
                  />
                  <span>{String(slideCount).padStart(2, '0')}</span>
                  <button
                    type="button"
                    className="cre-hero-paginator-btn"
                    onClick={nextSlide}
                    aria-label="Next featured photo"
                  >
                    ›
                  </button>
                </div>
                <div className="cre-hero-slides" aria-live="polite">
                  {featured.map((p, i) => {
                    const show = i === slideIndex || i === (slideIndex + 1) % slideCount
                    return (
                      <article
                        key={p.id}
                        className="cre-hero-slide"
                        hidden={!show}
                      >
                        {p.resolvedSrc && (
                          <img src={p.resolvedSrc} alt={p.title || p.category} loading="lazy" />
                        )}
                        <div className="cre-hero-slide-body">
                          <p className="cre-hero-slide-title">{p.title || p.category}</p>
                          <p className="cre-hero-slide-caption">
                            {p.caption || `${p.category} · ${name}`}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Category rail (3 vertical photo cards) ---------- */}
      <section className="cre-rail" aria-labelledby="rail-head">
        <p id="rail-head" className="cre-eyebrow">
          <span className="cre-eyebrow-num">(02)</span> Featured categories
        </p>
        <div className="cre-rail-grid">
          {railCards.map((card) => (
            <Link
              key={card.slug}
              to={`/gallery?category=${card.slug}`}
              className="cre-rail-card"
              aria-label={`Open the ${card.label} gallery`}
            >
              {card.image && (
                <img src={card.image} alt={`${card.label} photography sample`} loading="lazy" />
              )}
              <div className="cre-rail-card-body">
                <h3 className="cre-rail-card-title">{card.label}</h3>
                <span className="cre-cta" aria-hidden="true">
                  More Details
                  <span className="cre-cta-arrow">↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="cre-footer" role="contentinfo">
        <div className="cre-footer-top">
          <div className="cre-footer-brand">
            <h2>{name}</h2>
            <p>
              {homeContent.footer.tagline || 'Photography across Accra and beyond.'}{' '}
              {homeContent.footer.smallPrint}
            </p>
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
            </ul>
          </nav>
          <div id="site-footer-contact" className="cre-footer-col">
            <h3>Contact</h3>
            <ul>
              {profile.phone && (
                <li>
                  <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a>
                </li>
              )}
              {profile.email && (
                <li>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
              )}
              {profile.address && <li>{profile.address}</li>}
            </ul>
          </div>
        </div>
        <div className="cre-footer-bottom">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p>Accra &middot; Ghana</p>
        </div>
      </footer>
    </div>
  )
}
