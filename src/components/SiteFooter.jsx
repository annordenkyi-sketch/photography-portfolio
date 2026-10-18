import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as studioProfile from '../services/studioProfileService.js'
import { homeContent } from '../data/homeContent.js'

// Public site footer. Editorial 4-column layout with:
// - Brand + socials (icon-only, outlined — Instagram only per site brief)
// - Explore (Home / About / Gallery / Packages / Contact)
// - What I shoot (category gallery links)
// - Get in touch (click-to-call phone, email, address, WhatsApp)
// - Bottom bar with copyright + Back to top
export default function SiteFooter() {
  const [profile, setProfile] = useState(() => studioProfile.getProfile())
  const year = new Date().getFullYear()

  // Live-refresh when studio profile changes elsewhere
  useEffect(() => {
    function refresh() { setProfile(studioProfile.getProfile()) }
    window.addEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(studioProfile.CHANGED_EVENT_NAME, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Social list — Instagram only (per site brief). Other handles in the
  // studio profile are ignored on the public footer.
  const socials = [
    profile.instagram && { label: 'Instagram', href: `https://instagram.com/${stripAt(profile.instagram)}`, Icon: InstagramIcon },
  ].filter(Boolean)

  const whatsappDigits = (profile.phone || '').replace(/[^\d]/g, '')
  const waHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null
  const telHref = profile.phone ? `tel:${profile.phone.replace(/\s+/g, '')}` : null

  // About/Contact are in-page anchors; use <a> so hash scroll works
  // reliably even when navigating from another route.
  const quickLinks = [
    { label: 'Home',     kind: 'route',  to: '/home' },
    { label: 'About',    kind: 'anchor', href: '/home#about' },
    { label: 'Gallery',  kind: 'route',  to: '/gallery' },
    { label: 'Packages', kind: 'route',  to: '/packages' },
    { label: 'Contact',  kind: 'anchor', href: '#site-footer-contact' },
  ]

  const services = [
    { label: 'Weddings',   slug: 'wedding' },
    { label: 'Portraits',  slug: 'portrait' },
    { label: 'Events',     slug: 'event' },
    { label: 'Landscapes', slug: 'landscape' },
  ]

  function scrollToTop() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <footer className="site-footer" role="contentinfo">
      {/* Hairline divider between the preceding page section and the
          footer. Sits inside a container-width wrapper so it aligns
          with the content, not the viewport edges. */}
      <div className="site-footer-rule" aria-hidden="true" />

      <div className="site-footer-inner">
        <div className="site-footer-col site-footer-brand">
          <p className="site-footer-brand-name">{profile.name}</p>
          <p className="site-footer-tagline">{homeContent.footer.tagline}</p>
          {socials.length > 0 && (
            <ul className="site-footer-socials" aria-label="Follow us">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="site-footer-col" aria-label="Explore">
          <h3>Explore</h3>
          <ul className="site-footer-links">
            {quickLinks.map((link) => (
              <li key={link.label}>
                {link.kind === 'route' ? (
                  <Link to={link.to}>{link.label}</Link>
                ) : (
                  <a href={link.href}>{link.label}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer-col" aria-label="What I shoot">
          <h3>What I shoot</h3>
          <ul className="site-footer-links">
            {services.map((svc) => (
              <li key={svc.slug}>
                <Link to={`/gallery?category=${svc.slug}`}>{svc.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div id="site-footer-contact" className="site-footer-col">
          <h3>Get in touch</h3>
          <ul className="site-footer-contact-list">
            {telHref && (
              <li>
                <a href={telHref} className="site-footer-contact-link">
                  {profile.phone}
                </a>
              </li>
            )}
            <li>
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className="site-footer-contact-link">
                  {profile.email}
                </a>
              ) : (
                <span className="site-footer-contact-placeholder">
                  Email coming soon
                </span>
              )}
            </li>
            {profile.address && (
              <li className="site-footer-contact-address">{profile.address}</li>
            )}
            {waHref && (
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-wa-btn"
                >
                  <WhatsAppIcon />
                  <span>Message on WhatsApp</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© {year} {profile.name}. All rights reserved.</p>
        <button
          type="button"
          className="site-footer-top-btn"
          onClick={scrollToTop}
        >
          Back to top <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  )
}

function stripAt(handle) { return (handle || '').replace(/^@/, '') }

/* --- Outline icons (no filled shapes, no emoji, no stock icon set) --- */
function Icon({ children, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function InstagramIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  )
}

function WhatsAppIcon() {
  return (
    <Icon size={18}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5.2A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.5 9.5c0 4 3 7 7 7M8.5 9.5c.5-.5 1.5-1 2-.5l1 1.5-1 1a5 5 0 0 0 3 3l1-1 1.5 1c.5.5 0 1.5-.5 2" />
    </Icon>
  )
}
