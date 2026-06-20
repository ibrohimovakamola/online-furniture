import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { b2bApi } from '../api/b2bApi'
import { persistAuthSession } from '@/features/auth/authStorage'
import { setAuthSession } from '@/features/auth/authSlice'

export default function B2BLoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await b2bApi.login({ email, password })
      persistAuthSession({ token: data.token, user: data.user })
      dispatch(setAuthSession({ token: data.token, user: data.user }))
      navigate(data.portalAccess ? '/designer-portal/dashboard' : '/designer-portal/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-3">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white border border-[#0b3c3c]/10 p-8 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold text-kresla-dark">B2B Partner Login</h1>
        <p className="text-sm text-gray-600">Access wholesale catalog, orders, and account tools.</p>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-kresla-dark py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-gray-600">
          New partner? <Link to="/designer-portal/register" className="text-kresla-primary font-semibold">Apply here</Link>
        </p>
      </form>
    </div>
  )
}
