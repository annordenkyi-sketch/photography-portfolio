import { useState } from 'react'
import { packages } from '../data/packages.js'
import BookingModal from '../components/BookingModal.jsx'

// Placeholder packages cover image. Replace with your own photo URL
// or drop a file into /public and reference it as "/packages-hero.jpg".
const PACKAGES_HERO = 'https://picsum.photos/seed/perry-packages/1920/1080'

export default function Packages() {
  const [openPkg, setOpenPkg] = useState(null)

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

      <section className="container packages">
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
