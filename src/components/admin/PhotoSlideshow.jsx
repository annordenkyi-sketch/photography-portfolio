import { useEffect, useRef, useState } from 'react'

// Slow crossfade slideshow with a gentle Ken Burns zoom on each slide.
// - crossfade duration ~1.5s, interval 5.5s per slide (configurable via props)
// - Ken Burns: scale 1.0 → 1.08 over the slide's visible time
// - Honours prefers-reduced-motion: no interval, no zoom, static first slide
export default function PhotoSlideshow({
  images,
  interval = 5500,
  className = '',
}) {
  const [index, setIndex] = useState(0)
  const reducedMotion = useReducedMotion()
  const timerRef = useRef(null)

  useEffect(() => {
    if (reducedMotion || images.length <= 1) return undefined
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, interval)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [images.length, interval, reducedMotion])

  return (
    <div className={`photo-slideshow${className ? ` ${className}` : ''}`} aria-hidden="true">
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          width="1920"
          height="1080"
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : 'low'}
          className={`photo-slide${i === index ? ' is-active' : ''}`}
        />
      ))}
    </div>
  )
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const handler = (e) => setReduce(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduce
}
