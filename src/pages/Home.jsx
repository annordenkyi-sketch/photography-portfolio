import { Link } from 'react-router-dom'

// Placeholder hero image. Replace with your own photo URL
// or drop a file into /public and reference it as "/home-hero.jpg".
const HERO_IMAGE = 'https://picsum.photos/seed/perry-home/1920/1080'

export default function Home() {
  return (
    <section className="hero">
      <img
        className="hero-bg"
        src={HERO_IMAGE}
        alt=""
        fetchpriority="high"
        aria-hidden="true"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="reveal reveal-1">Perry Photography</h1>
        <p className="tagline reveal reveal-2">
          Capturing weddings, portraits, events and landscapes with a careful eye and an honest story.
        </p>
        <p className="intro reveal reveal-3">
          I'm a photographer based in your city, working with couples, families and brands who want
          images that still feel like them a decade from now. Browse recent work or get in touch to
          plan your shoot.
        </p>
        <div className="cta-row reveal reveal-4">
          <Link to="/gallery" className="btn btn-primary">View gallery</Link>
          <Link to="/packages" className="btn btn-secondary">See packages</Link>
        </div>
      </div>
    </section>
  )
}
