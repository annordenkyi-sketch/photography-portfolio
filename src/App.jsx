import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Cover from './pages/Cover.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import Packages from './pages/Packages.jsx'
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

      {/* Admin: login is public; everything else is behind ProtectedRoute. */}
      <Route path="admin/login" element={<AdminLogin />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/bookings" element={<AdminBookings />} />
        <Route path="admin/calendar" element={<AdminCalendar />} />
        <Route path="admin/payments" element={<AdminPayments />} />
        <Route path="admin/notifications" element={<AdminNotifications />} />
        <Route path="admin/portfolio/*" element={<AdminPortfolio />} />
        <Route path="admin/settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}
