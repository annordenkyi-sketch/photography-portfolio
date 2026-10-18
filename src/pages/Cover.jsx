import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as portfolio from '../services/portfolioService.js'
import * as studioProfile from '../services/studioProfileService.js'

// Placeholder cover image. Replace the `src` with your own photo URL,
// or drop a file into /public and reference it as "/cover.jpg".
const COVER_IMAGE = 'https://picsum.photos/seed/perry-cover/1920/1080'

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
        alt=""
        fetchPriority="high"
        aria-hidden="true"
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
