import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../services/authService.js'

// Wraps the admin layout. Redirects to the login page when the admin is
// not authenticated, preserving the intended destination in location state
// so a future login flow could redirect back here.
export default function ProtectedRoute({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return children
}
