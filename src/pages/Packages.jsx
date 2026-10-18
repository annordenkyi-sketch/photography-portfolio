import { useEffect, useRef, useState } from 'react'
import { packages } from '../data/packages.js'
import BookingModal from '../components/BookingModal.jsx'

// Placeholder packages cover image. Replace with your own photo URL
// or drop a file into /public and reference it as "/packages-hero.jpg".
const PACKAGES_HERO = 'https://picsum.photos/seed/perry-packages/1920/1080'

export default function Packages() {
  const [openPkg, setOpenPkg] = useState(null)
  const cardsRef = useRef(null)

  // Scroll the package cards into view on mount so visitors coming from
  // a Book Now CTA land straight on the choices rather than the hero.
  // Hero stays above for scroll-back. Respects reduced-motion.
  useEffect(() => {
    const el = cardsRef.current
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Defer one frame so the browser has laid out the hero first.
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <>
      <section className="page-hero">
        <img
          className="page-hero-bg"
          src={PACKAGES_HERO}
          alt=""
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <h1 className="reveal reveal-1">Packages</h1>
          <p className="reveal reveal-2">
            Simple, honest pricing. Need something custom? Pick the closest package and leave the
            details in the notes.
          </p>
        </div>
      </section>

      <section ref={cardsRef} className="container packages">
        <ul className="packages-grid">
          {packages.map((pkg) => (
            <li key={pkg.id} className={`package-card${pkg.featured ? ' is-featured' : ''}`}>
              {pkg.featured && <span className="package-badge">Most popular</span>}
              <h2>{pkg.name}</h2>
              <p className="package-price">{pkg.price}</p>
              <p className="package-duration">{pkg.duration}</p>
              <ul className="package-features">
                {pkg.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setOpenPkg(pkg)}
              >
                Book this package
              </button>
            </li>
          ))}
        </ul>
      </section>

      {openPkg && <BookingModal pkg={openPkg} onClose={() => setOpenPkg(null)} />}
    </>
  )
}
