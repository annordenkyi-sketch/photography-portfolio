import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStudioProfile } from '../hooks/useStudioProfile.js'

// Top menu for the dark public pages (Home, Portfolio, Packages, Contact).
// It sits over the page hero.
// - Wider screens: the four links sit beside the studio name.
// - Phones (≤760px): a ≡ menu button (rounded square, light outline) opens
//   a panel with the four links. It closes on a link tap, a tap outside,
//   the Escape key, or a page change; focus returns to the button on Escape.
// - `band`: a dark translucent strip behind it (bright hero photos).
// - `overHero` + `heroRef` (Contact page only): fixed to the top; fully
//   transparent with white text over the hero, then it fades into a solid
//   dark bar (white text) once the hero has scrolled out from under it.
export default function PublicNav({ band = false, overHero = false, heroRef = null }) {
  const profile = useStudioProfile()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const navRef = useRef(null)
  const buttonRef = useRef(null)
  const studioName = profile.name || '[STUDIO NAME]'
  const navClass = ({ isActive }) => `xoon-nav-link${isActive ? ' is-active' : ''}`
  const close = () => setMenuOpen(false)

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

  // Close the phone menu when the page changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // While open: Escape closes (focus back to the button); a tap outside closes.
  useEffect(() => {
    if (!menuOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointer(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  const classes = [
    'xoon-nav',
    band && 'xoon-nav--band',
    overHero && 'xoon-nav--over',
    overHero && solid && 'is-solid',
    menuOpen && 'is-menu-open',
  ].filter(Boolean).join(' ')

  return (
    <nav ref={navRef} className={classes} aria-label="Primary">
      <Link to="/home" className="xoon-logo">
        <span className="xoon-logo-mark" aria-hidden="true">✦</span>
        <span>{studioName}</span>
      </Link>
      <button
        ref={buttonRef}
        type="button"
        className="xoon-nav-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="xoon-nav-links"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        )}
      </button>
      <ul id="xoon-nav-links" className={`xoon-nav-links${menuOpen ? ' is-open' : ''}`}>
        <li><NavLink to="/home" end className={navClass} onClick={close}>Home</NavLink></li>
        <li><NavLink to="/portfolio" className={navClass} onClick={close}>Portfolio</NavLink></li>
        <li><NavLink to="/packages" className={navClass} onClick={close}>Packages</NavLink></li>
        <li><NavLink to="/contact" className={navClass} onClick={close}>Contact</NavLink></li>
      </ul>
    </nav>
  )
}
