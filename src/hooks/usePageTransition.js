import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

// Page transition into /home, /portfolio and /packages: the current page
// fades out and the new page fades + slides up (CSS: rule 9 "/portfolio
// motion" in the animation block at the end of index.css).
//
// Uses the browser's View Transitions API. BrowserRouter ignores React
// Router's `viewTransition` prop (it needs a data router), so this listens
// for clicks on any same-site link to those pages — menu, footer, Home
// buttons, Contact, the older footer — and runs the navigation inside
// document.startViewTransition(). It listens in the capture phase and
// calls preventDefault(), so React Router's own <Link> handler skips it.
//
// Skipped (plain navigation instead) when: already on that page (e.g. the
// Portfolio category tabs, which animate in-page), reduced motion is on, the browser has no
// View Transitions support, or the click opens a new tab/window.
// Every page change also starts at the top of the new page (see below).
const ANIMATED_PATHS = new Set(['/home', '/portfolio', '/packages'])

export function usePageTransition() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Start each new page at the top. Without this, coming back to Home from
  // a scrolled page landed mid-page, where photos were still loading and
  // the hero's entrance had already played out of view. Links to an
  // in-page anchor (#…) keep the browser's jump.
  useEffect(() => {
    if (window.location.hash) return
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || !ANIMATED_PATHS.has(url.pathname)) return
      if (pathname === url.pathname) return

      e.preventDefault()
      const go = () => {
        navigate(url.pathname + url.search + url.hash)
        window.scrollTo(0, 0)
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced || typeof document.startViewTransition !== 'function') {
        go()
        return
      }
      const root = document.documentElement
      root.dataset.pageTransition = url.pathname.slice(1)
      const transition = document.startViewTransition(() => flushSync(go))
      transition.finished.finally(() => { delete root.dataset.pageTransition })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate, pathname])
}
