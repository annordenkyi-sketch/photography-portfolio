import { useEffect, useRef, useState } from 'react'

// Native <dialog>-based lightbox. Keyboard: Esc closes, ← / → move.
// Backdrop click closes. Touch swipe left/right moves.
export default function Lightbox({ items, startIndex = 0, onClose }) {
  const dialogRef = useRef(null)
  const touchStartX = useRef(null)
  const [index, setIndex] = useState(startIndex)

  const current = items[index]
  const canPrev = items.length > 1
  const canNext = items.length > 1

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)
  const next = () => setIndex((i) => (i + 1) % items.length)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (!dlg.open) dlg.showModal()
    const onNativeClose = () => onCloseRef.current()
    dlg.addEventListener('close', onNativeClose)
    return () => dlg.removeEventListener('close', onNativeClose)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  function handleBackdrop(e) {
    if (e.target === dialogRef.current) onCloseRef.current()
  }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev()
    }
    touchStartX.current = null
  }

  if (!current) return null

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      onClick={handleBackdrop}
      aria-label="Photo viewer"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button type="button" className="lightbox-close" onClick={() => onCloseRef.current()} aria-label="Close">×</button>

      {canPrev && (
        <button type="button" className="lightbox-nav lightbox-nav--prev" onClick={prev} aria-label="Previous photo">‹</button>
      )}

      <figure className="lightbox-figure">
        <img src={current.src} alt={current.alt || ''} className="lightbox-img" />
        {(current.title || current.category) && (
          <figcaption className="lightbox-caption">
            {current.title && <span>{current.title}</span>}
            {current.category && <span className="lightbox-caption-sep">·</span>}
            {current.category && <span className="lightbox-caption-cat">{current.category}</span>}
            <span className="lightbox-counter">{index + 1} / {items.length}</span>
          </figcaption>
        )}
      </figure>

      {canNext && (
        <button type="button" className="lightbox-nav lightbox-nav--next" onClick={next} aria-label="Next photo">›</button>
      )}
    </dialog>
  )
}
