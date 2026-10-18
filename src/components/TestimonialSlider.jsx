import { useEffect, useRef, useState } from 'react'

// Accessible slider: prev/next, dot indicators, autoplay with
// pause-on-hover/focus and reduced-motion. One slide visible at a time.
export default function TestimonialSlider({ items, autoplayMs = 6500 }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef(null)

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)
  const next = () => setIndex((i) => (i + 1) % items.length)

  useEffect(() => {
    if (paused || items.length < 2) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, autoplayMs)
    return () => window.clearInterval(id)
  }, [paused, items.length, autoplayMs])

  function onKey(e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next() }
  }

  if (items.length === 0) return null
  const t = items[index]

  return (
    <div
      ref={regionRef}
      className="testimonial-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKey}
      tabIndex={0}
    >
      <figure className="testimonial-slide" aria-live="polite">
        <blockquote className="testimonial-quote">“{t.quote}”</blockquote>
        <figcaption className="testimonial-cite">
          <span className="testimonial-name">{t.name}</span>
          {t.role && <span className="testimonial-role"> · {t.role}</span>}
        </figcaption>
      </figure>

      {items.length > 1 && (
        <>
          <div className="testimonial-controls">
            <button type="button" className="testimonial-arrow" onClick={prev} aria-label="Previous testimonial">‹</button>
            <div className="testimonial-dots" role="tablist" aria-label="Choose testimonial">
              {items.map((item, i) => (
                <button
                  key={item.id || i}
                  type="button"
                  className={`testimonial-dot${i === index ? ' is-active' : ''}`}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Testimonial ${i + 1} of ${items.length}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <button type="button" className="testimonial-arrow" onClick={next} aria-label="Next testimonial">›</button>
          </div>
        </>
      )}
    </div>
  )
}
