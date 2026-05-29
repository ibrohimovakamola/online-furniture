import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAuth, selectIsAdmin } from '../authSlice'
import { canAccessAdminRoute } from '../permissions'

export function AdminRouteGuard() {
  const location = useLocation()
  const { user, initialized, token } = useSelector(selectAuth)
  const isAdmin = useSelector(selectIsAdmin)

  if (!initialized && token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] text-[#0b3c3c]">
        Verifying session…
      </div>
    )
  }

  if (!user || !token || !isAdmin) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!canAccessAdminRoute(user.role, location.pathname)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

export function ProtectedRoute({ redirectTo = '/login' }) {
  const location = useLocation()
  const { user, token, initialized } = useSelector(selectAuth)

  if (!initialized) return null

  if (!user || !token) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { user, token } = useSelector(selectAuth)
  const isAdmin = useSelector(selectIsAdmin)

  if (user && token) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }

  return <Outlet />
}

export default AdminRouteGuard
