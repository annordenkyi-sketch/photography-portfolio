import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import SiteFooter from './SiteFooter.jsx'

export default function Layout() {
  return (
    <div className="site">
      <Header />
      <Outlet />
      <SiteFooter />
    </div>
  )
}
