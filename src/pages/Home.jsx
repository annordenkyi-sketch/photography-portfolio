import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import * as studioProfile from '../services/studioProfileService.js'
import { homeContent } from '../data/homeContent.js'
import { slugToLabel } from '../data/galleryCategories.js'
import TestimonialSlider from '../components/TestimonialSlider.jsx'

const DEFAULT_HERO = 'https://picsum.photos/seed/perry-home/1920/1080'

export default function Home() {
  const [profile, setProfile] = useState(() => studioProfile.getProfile())
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO)
  const [portraitImage, setPortraitImage] = useState(null)
  const [publicPhotos, setPublicPhotos] = useState([])

  // Refresh profile on edits
  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Load all images/data from services
  useEffect(() => {
    let revokes = []
    let cancelled = false
    async function load() {
      const [hero, portrait] = await Promise.all([
        portfolio.getSiteImageUrl('home_hero'),
        portfolio.getSiteImageUrl('home_portrait'),
      ])
      if (cancelled) return
      if (hero) { setHeroImage(hero); if (hero.startsWith('blob:')) revokes.push(hero) }
      if (portrait) { setPortraitImage(portrait); if (portrait.startsWith('blob:')) revokes.push(portrait) }

      const publics = portfolio.listPublicPhotos()
      const publicItems = await Promise.all(publics.map(async (p) => {
        const url = await portfolio.resolveFullUrl(p)
        if (url && url.startsWith('blob:')) revokes.push(url)
        return { ...p, resolvedSrc: url }
      }))
      if (!cancelled) setPublicPhotos(publicItems)
    }
    load()
    return () => { cancelled = true; for (const u of revokes) URL.revokeObjectURL(u) }
  }, [])

  // Services cards: slug + display label + the first non-hidden photo from
  // that category. Matching is done by the shared label (singular form)
  // against the photo's stored category — the Home card label can be
  // plural ("Weddings") without affecting the match.
  const serviceCards = useMemo(() => {
    return homeContent.services.items.map((item) => {
      const matchLabel = slugToLabel(item.slug) || item.slug
      const match = publicPhotos.find((p) => p.category.toLowerCase() === matchLabel.toLowerCase())
      return {
        ...item,
        label: item.displayLabel || matchLabel,
        image: match?.resolvedSrc || null,
      }
    })
  }, [publicPhotos])

  const firstName = (profile.name || 'Perry').trim().split(/\s+/)[0]

  return (
    <>
      {/* -------- 1. HERO -------- */}
      <section className="h-hero h-hero--editorial">
        <img
          className="h-hero-bg"
          src={heroImage}
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="h-hero-scrim" aria-hidden="true" />
        <div className="h-hero-content">
          <p className="h-hero-eyebrow reveal reveal-1">
            {homeContent.hero.eyebrow || 'Photography · Accra, Ghana'}
          </p>
          <h1 className="h-hero-title reveal reveal-2">{profile.name}</h1>
          <span className="h-hero-rule reveal reveal-2" aria-hidden="true" />
          <p className="h-hero-tagline reveal reveal-3">{profile.tagline}</p>
          <div className="h-hero-cta reveal reveal-3">
            <Link to={homeContent.hero.primaryCta.to} className="btn btn-primary">
              {homeContent.hero.primaryCta.label}
            </Link>
            <Link to={homeContent.hero.secondaryCta.to} className="h-hero-ghost">
              {homeContent.hero.secondaryCta.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <a href="#about" className="h-hero-scroll" aria-label="Scroll to About section">
          <span className="h-hero-scroll-label">Scroll</span>
          <span className="h-hero-scroll-arrow" aria-hidden="true" />
        </a>
      </section>

      {/* -------- 2. ABOUT -------- */}
      <section id="about" className="h-about h-about--editorial">
        <div className="h-about-inner">
          <div className="h-about-grid">
            <figure className="h-about-media">
              {portraitImage && (
                <img src={portraitImage} alt={`${profile.name} photographer at work`} loading="lazy" />
              )}
              <figcaption className="h-about-media-cap">
                <span>No. 01</span>
                <span>{firstName} — Behind the lens</span>
              </figcaption>
            </figure>
            <div className="h-about-copy">
              <p className="h-eyebrow h-eyebrow--rule">About the studio</p>
              <h2 className="h-about-title">{homeContent.about.headingPrefix} {firstName}.</h2>
              {homeContent.about.paragraphs.map((p, i) => (
                <p key={i} className="h-about-paragraph">{p}</p>
              ))}
              <Link to={homeContent.about.ctaTo} className="h-about-cta">
                {homeContent.about.ctaLabel} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <ul className="h-stats">
            {homeContent.stats.map((s) => (
              <li key={s.label} className="h-stat">
                <strong className="h-stat-number">{s.number}</strong>
                <span className="h-stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------- 3. SERVICES -------- */}
      <section className="h-section h-services">
        <div className="h-container">
          <header className="h-section-head">
            <p className="h-eyebrow">Services</p>
            <h2>{homeContent.services.heading}</h2>
            <p className="h-section-tagline">{homeContent.services.tagline}</p>
          </header>
          <ul className="h-services-grid">
            {serviceCards.map((card) => (
              <li key={card.slug} className="h-service-card">
                <Link to={`/gallery?category=${card.slug}`} className="h-service-link">
                  <div className="h-service-media">
                    {card.image ? (
                      <img src={card.image} alt="" loading="lazy" />
                    ) : (
                      <div className="h-service-placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="h-service-body">
                    <h3>{card.label}</h3>
                    <p>{card.description}</p>
                    <span className="h-service-explore">Explore →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------- 4. HOW IT WORKS -------- */}
      <section className="h-section h-steps">
        <div className="h-container">
          <header className="h-section-head">
            <p className="h-eyebrow">The process</p>
            <h2>{homeContent.howItWorks.heading}</h2>
            <p className="h-section-tagline">{homeContent.howItWorks.tagline}</p>
          </header>
          <ol className="h-steps-list">
            {homeContent.howItWorks.steps.map((step, i) => (
              <li key={step.number} className="h-step">
                <div className="h-step-icon" aria-hidden="true">
                  {i === 0 && <PackageIcon />}
                  {i === 1 && <CalendarIcon />}
                  {i === 2 && <CheckIcon />}
                </div>
                <span className="h-step-num" aria-hidden="true">{String(step.number).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="h-steps-cta">
            <Link to="/packages" className="btn btn-primary btn-cta">Book Now</Link>
          </div>
        </div>
        <div className="h-section-divider" aria-hidden="true" />
      </section>

      {/* -------- 5. TESTIMONIALS -------- */}
      <section className="h-section h-testimonials">
        <div className="h-container">
          <header className="h-section-head">
            <p className="h-eyebrow">Reviews</p>
            <h2>{homeContent.testimonials.heading}</h2>
            <p className="h-section-tagline">{homeContent.testimonials.tagline}</p>
          </header>
          <TestimonialSlider items={homeContent.testimonials.items} autoplayMs={homeContent.testimonials.autoplayMs} />
        </div>
      </section>

    </>
  )
}

/* --- Icons for the How It Works section ------------------------------- */
function PackageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.3 7.5 12 12l8.7-4.5" />
      <path d="M12 22V12" />
      <path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5v-9Z" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  )
}
