import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import AuthLoadingScreen from './AuthLoadingScreen'

/**
 * Protects routes by authentication and optional admin role.
 * requiredRole="admin" accepts super_admin / manager from the API.
 */
export default function ProtectedRoute({
  requiredRole,
  redirectTo = '/login',
}) {
  const location = useLocation()
  const { isAuthReady, isAuthenticated, isAdmin } = useAuth()

  if (!isAuthReady) {
    return (
      <AuthLoadingScreen
        label={requiredRole === 'admin' ? 'Verifying admin session…' : 'Checking session…'}
      />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{ adminDenied: true, message: 'Admin access required. Use an admin account.' }}
      />
    )
  }

  return <Outlet />
}
