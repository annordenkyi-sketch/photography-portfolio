import { Link } from 'react-router-dom'

// Placeholder cover image. Replace the `src` with your own photo URL,
// or drop a file into /public and reference it as "/cover.jpg".
const COVER_IMAGE = 'https://picsum.photos/seed/perry-cover/1920/1080'

export default function Cover() {
  return (
    <section className="cover">
      <img
        className="cover-bg"
        src={COVER_IMAGE}
        alt=""
        fetchPriority="high"
        aria-hidden="true"
      />
      <div className="cover-overlay" />
      <div className="cover-content">
        <h1 className="cover-brand reveal reveal-1">Perry Studios</h1>
        <p className="cover-tagline reveal reveal-2">Weddings · Portraits · Events · Landscapes</p>
        <div className="reveal reveal-3">
          <Link to="/home" className="btn btn-cover">Enter site</Link>
        </div>
      </div>
    </section>
  )
}
