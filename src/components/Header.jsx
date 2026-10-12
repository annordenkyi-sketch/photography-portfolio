import { NavLink, Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/home" className="brand">Perry Studios</Link>
      <nav className="site-nav" aria-label="Primary">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
        <NavLink to="/packages">Packages</NavLink>
      </nav>
    </header>
  )
}
