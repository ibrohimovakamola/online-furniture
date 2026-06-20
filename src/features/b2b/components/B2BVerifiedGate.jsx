import { Navigate, useOutletContext } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { Link } from 'react-router-dom'
import VerificationPending from './registration/VerificationPending'

/** Gate B2B routes — requires auth + verified profile */
export default function B2BVerifiedGate({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  const { profile, refresh } = useOutletContext() || {}

  if (!isAuth) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 mb-4">Log in to access the B2B portal.</p>
        <Link to="/designer-portal/login" className="text-kresla-primary font-semibold">
          B2B Partner Login →
        </Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-kresla-dark">No B2B application yet</h2>
        <p className="mt-2 text-gray-600">Register your business to access wholesale pricing.</p>
        <Link
          to="/designer-portal/register"
          className="inline-block mt-6 rounded-lg bg-kresla-dark px-6 py-2.5 text-sm font-medium text-white"
        >
          Start B2B Registration
        </Link>
      </div>
    )
  }

  if (profile.status !== 'verified') {
    return <VerificationPending profile={profile} onRefresh={refresh} />
  }

  return children
}
