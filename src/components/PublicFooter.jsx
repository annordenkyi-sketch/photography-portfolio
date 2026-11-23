import { Link } from 'react-router-dom'
import { homeContent } from '../data/homeContent.js'
import { useStudioProfile } from '../hooks/useStudioProfile.js'

// Footer for the dark public pages (Home, Portfolio). Render it outside
// <main> so it maps to the page's single contentinfo landmark (WAI-ARIA
// APG). Its links nav repeats the top menu, so it shares the "Primary"
// label. "Back to top" targets an element with id="top" on the page.
export default function PublicFooter() {
  const profile = useStudioProfile()
  const studioName = profile.name || '[STUDIO NAME]'

  const igHandle = stripAt(profile.instagram)
  const tiktokHandle = stripAt(profile.tiktok)
  const waDigits = (profile.phone || '').replace(/[^\d]/g, '')
  const socials = [
    igHandle && { label: 'Instagram', href: `https://instagram.com/${igHandle}`, Icon: InstagramIcon },
    tiktokHandle && { label: 'TikTok', href: `https://tiktok.com/@${tiktokHandle}`, Icon: TikTokIcon },
    waDigits && { label: 'WhatsApp', href: `https://wa.me/${waDigits}`, Icon: WhatsAppIcon },
  ].filter(Boolean)

  return (
    <footer className="xoon-footer">
      <div className="xoon-footer-grid">
        <div className="xoon-footer-brand">
          <Link to="/home" className="xoon-logo">
            <span className="xoon-logo-mark" aria-hidden="true">✦</span>
            <span>{studioName}</span>
          </Link>
          <p className="xoon-footer-eyebrow">{homeContent.hero.eyebrow}</p>
        </div>

        <nav className="xoon-footer-col" aria-label="Primary">
          <h2 className="xoon-footer-title">Useful links</h2>
          <ul className="xoon-footer-list">
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/packages">Packages</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>

        {(profile.phone || profile.email || profile.address) && (
          <div className="xoon-footer-col">
            <h2 className="xoon-footer-title">Contact</h2>
            {/* <address> = the studio's contact details (MDN). */}
            <address className="xoon-footer-list">
              {profile.phone && <a href={`tel:${profile.phone.replace(/\s+/g, '')}`}>{profile.phone}</a>}
              {profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
              {profile.address && <span>{profile.address}</span>}
            </address>
          </div>
        )}

        {socials.length > 0 && (
          <div className="xoon-footer-col">
            <h2 className="xoon-footer-title">Follow us</h2>
            <ul className="xoon-footer-social" aria-label="Social links">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="xoon-footer-bottom">
        <p>© {new Date().getFullYear()} {studioName}. All rights reserved.</p>
        <a href="#top" className="xoon-footer-top">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  )
}

function stripAt(handle) { return (handle || '').replace(/^@/, '') }

function Svg({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
function InstagramIcon() {
  return (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </Svg>
  )
}
function TikTokIcon() {
  return (
    <Svg>
      <path d="M9 11.5a4.5 4.5 0 1 0 4.5 4.5V3h2.5a4.5 4.5 0 0 0 4.5 4.5" />
    </Svg>
  )
}
function WhatsAppIcon() {
  return (
    <Svg>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5.2A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.5 9.5c0 4 3 7 7 7M8.5 9.5c.5-.5 1.5-1 2-.5l1 1.5-1 1a5 5 0 0 0 3 3l1-1 1.5 1c.5.5 0 1.5-.5 2" />
    </Svg>
  )
}
