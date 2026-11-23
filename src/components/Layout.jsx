import { Outlet } from 'react-router-dom'
import SiteFooter from './SiteFooter.jsx'

// Legacy layout used by Portfolio, Packages and Book. The top <Header /> was
// removed per spec — those pages now render page content at the top of
// the viewport, followed by the shared SiteFooter.
export default function Layout() {
  return (
    <div className="site">
      <Outlet />
      <SiteFooter />
    </div>
  )
}
