import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Cover from './pages/Cover.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import Packages from './pages/Packages.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Cover />} />
      <Route element={<Layout />}>
        <Route path="home" element={<Home />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="packages" element={<Packages />} />
        {/* Legacy /book URL now redirects to the packages page where booking lives. */}
        <Route path="book" element={<Navigate to="/packages" replace />} />
      </Route>
    </Routes>
  )
}
