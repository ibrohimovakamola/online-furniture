import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import AuthLoadingScreen from './AuthLoadingScreen'
import ProtectedRoute from './ProtectedRoute'

export { default as ProtectedRoute } from './ProtectedRoute'

export function AdminRouteGuard() {
  return <ProtectedRoute requiredRole="admin" />
}

export function GuestRoute() {
  const location = useLocation()
  const { user, token, isAdmin, isAuthReady } = useAuth()

  if (!isAuthReady) {
    return <AuthLoadingScreen />
  }

  if (user && token) {
    if (location.state?.adminDenied) {
      return <Outlet />
    }
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }

  return <Outlet />
}

export default AdminRouteGuard
