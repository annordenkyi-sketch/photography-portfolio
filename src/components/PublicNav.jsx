import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStudioProfile } from '../hooks/useStudioProfile.js'

// Top menu for the dark public pages (Home, Portfolio, Packages, Contact).
// It sits over the page hero. The four links are always visible: beside
// the studio name on wider screens, in a full-width row under it on phones
// (no hidden ≡ menu).
// - `band`: a dark translucent strip behind it (bright hero photos).
// - `overHero` + `heroRef` (Contact page only): fixed to the top; fully
//   transparent with white text over the hero, then it fades into a solid
//   dark bar (white text) once the hero has scrolled out from under it.
//   Other pages don't pass these, so their header is unchanged.
export default function PublicNav({ band = false, overHero = false, heroRef = null }) {
  const profile = useStudioProfile()
  const [solid, setSolid] = useState(false)
  const studioName = profile.name || '[STUDIO NAME]'
  const navClass = ({ isActive }) => `xoon-nav-link${isActive ? ' is-active' : ''}`

  // Solid once the hero's bottom edge passes under the bar (~72px).
  useEffect(() => {
    const hero = heroRef?.current
    if (!overHero || !hero || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [overHero, heroRef])

  const classes = [
    'xoon-nav',
    band && 'xoon-nav--band',
    overHero && 'xoon-nav--over',
    overHero && solid && 'is-solid',
  ].filter(Boolean).join(' ')

  return (
    <nav className={classes} aria-label="Primary">
      <Link to="/home" className="xoon-logo">
        <span className="xoon-logo-mark" aria-hidden="true">✦</span>
        <span>{studioName}</span>
      </Link>
      <ul className="xoon-nav-links">
        <li><NavLink to="/home" end className={navClass}>Home</NavLink></li>
        <li><NavLink to="/portfolio" className={navClass}>Portfolio</NavLink></li>
        <li><NavLink to="/packages" className={navClass}>Packages</NavLink></li>
        <li><NavLink to="/contact" className={navClass}>Contact</NavLink></li>
      </ul>
    </nav>
  )
}
