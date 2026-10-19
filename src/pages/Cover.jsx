import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import * as studioProfile from '../services/studioProfileService.js'

// Default cover image: sunset over a beach with palm trees, Elmina,
// Ghana, by Wietse Jongsma on Unsplash. Served from Unsplash's CDN with
// WebP + resize params so it's delivered as a compressed, 1920px-wide
// WebP without a build-time image pipeline. Attribution:
// src/assets/home/CREDITS.md.
// Replace in Admin → Portfolio → Website images → "Home cover" to swap
// for the photographer's own work later.
const COVER_IMAGE = 'https://images.unsplash.com/photo-1745102098874-0a9d16c077ee?w=1920&q=80&fm=webp&auto=format'

export default function Cover() {
  const [coverImage, setCoverImage] = useState(COVER_IMAGE)
  const [profile, setProfile] = useState(() => studioProfile.getProfile())

  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let revokeUrl = null
    let cancelled = false
    async function load() {
      try {
        const url = await portfolio.getSiteImageUrl('cover')
        if (!cancelled && url) {
          setCoverImage(url)
          if (url.startsWith('blob:')) revokeUrl = url
        }
      } catch { /* fall back to default */ }
    }
    load()
    return () => {
      cancelled = true
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [])

  return (
    <section className="cover">
      <img
        className="cover-bg"
        src={coverImage}
        alt="Sunset over a palm-lined beach in Elmina, Ghana."
        fetchPriority="high"
      />
      <div className="cover-overlay" />
      <div className="cover-content">
        <h1 className="cover-brand reveal reveal-1">{profile.name}</h1>
        <p className="cover-tagline reveal reveal-2">{profile.tagline}</p>
        <div className="reveal reveal-3">
          <Link to="/home" className="btn btn-cover">Enter site</Link>
        </div>
      </div>
    </section>
  )
}
