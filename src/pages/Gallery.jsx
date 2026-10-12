import { useEffect, useRef } from 'react'
import { photos } from '../data/photos.js'

// Placeholder gallery cover image. Replace with your own photo URL
// or drop a file into /public and reference it as "/gallery-hero.jpg".
const GALLERY_HERO = 'https://picsum.photos/seed/perry-gallery/1920/1080'

export default function Gallery() {
  const gridRef = useRef(null)

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
  }, [])

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
          <h1 className="reveal reveal-1">Gallery</h1>
          <p className="reveal reveal-2">
            A selection of recent work across the categories I shoot.
          </p>
        </div>
      </section>
      <section className="container gallery">
        <ul className="gallery-grid" ref={gridRef}>
          {photos.map((photo) => (
            <li key={photo.id} className="gallery-item">
              <img src={photo.src} alt={photo.alt} loading="lazy" />
              <span className="gallery-caption">{photo.category}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
