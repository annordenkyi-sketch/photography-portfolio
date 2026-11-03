// Static photo panel for the admin dashboard. Previously cycled through
// `images` with a Ken Burns effect; stripped per the site-wide no-motion
// spec. Renders only the first image so the slot still carries visual
// weight without any autoplay.
export default function PhotoSlideshow({ images, className = '' }) {
  const first = images && images.length > 0 ? images[0] : null
  if (!first) return null
  return (
    <div className={`photo-slideshow${className ? ` ${className}` : ''}`} aria-hidden="true">
      <img
        src={first.src}
        alt={first.alt}
        width="1920"
        height="1080"
        loading="eager"
        fetchPriority="high"
        className="photo-slide is-active"
      />
    </div>
  )
}
