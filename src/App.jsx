import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import Packages from './pages/Packages.jsx'
import Book from './pages/Book.jsx'
import Contact from './pages/Contact.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminBookings from './pages/admin/AdminBookings.jsx'
import AdminCalendar from './pages/admin/AdminCalendar.jsx'
import AdminPayments from './pages/admin/AdminPayments.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'
import AdminPortfolio from './pages/admin/AdminPortfolio.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  // Routes mounted directly — no page-flip wrapper, no transitions. Each
  // link opens the next page the normal way.
  //
  // /         redirects to /home (Cover page removed)
  // /home     Home     — CREACY-style
  // /gallery  Gallery  — legacy
  // /packages Packages — legacy
  // /admin/*  Admin    — plain
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/portfolio/*" element={<AdminPortfolio />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route element={<Layout />}>
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/book" element={<Book />} />
      </Route>
    </Routes>
  )
}
