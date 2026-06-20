import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, clearAuthError, selectAuth } from '../features/auth/authSlice'
import { useAuth } from '../features/auth/AuthContext'
import { isAdminRole } from '../features/auth/permissions'
import '../assets/styles/login.scss'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector(selectAuth)
  const { syncSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (location.state?.from === '/admin' || location.state?.adminDenied) {
      setEmail('admin@exclusive.uz')
    }
  }, [location.state?.from, location.state?.adminDenied])

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())

    const result = await dispatch(
      loginUser({
        email: email.trim().toLowerCase(),
        password,
      })
    )

    if (loginUser.fulfilled.match(result)) {
      const userData = result.payload.user
      const authToken = result.payload.token

      syncSession(userData, authToken)

      if (isAdminRole(userData.role)) {
        navigate(location.state?.from || '/admin', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }

  const adminDeniedMessage = location.state?.adminDenied
    ? location.state?.message || 'This account does not have admin access.'
    : null

  return (
    <div className="container">
      <div className="login">
        <h2 className="login-title">Welcome back</h2>
        <p className="login-text">Akkauntingizga kirish uchun ma&apos;lumotingizni kiriting</p>

        {location.state?.from === '/admin' && !adminDeniedMessage && (
          <p className="login-text" style={{ marginBottom: '1rem' }}>
            Admin panel: <strong>admin@exclusive.uz</strong> / <strong>ChangeMe123!</strong>
          </p>
        )}

        {adminDeniedMessage && (
          <div className="login-error" role="alert">
            <p>{adminDeniedMessage}</p>
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            <p>{error}</p>
            {error.toLowerCase().includes('database') && (
              <p className="login-error-hint">
                {error.toLowerCase().includes('disk') || error.toLowerCase().includes('space') ? (
                  <>Free disk space on C: or switch to MongoDB Atlas in <code>server/.env</code>.</>
                ) : (
                  <>
                    Backend fix: open <code>server/.env</code>, set <code>MONGODB_URI=memory</code> or Atlas URI, then run{' '}
                    <code>npm run dev</code>.
                  </>
                )}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Email manzil
            <input
              placeholder="Email manzilingizni kiriting"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="login-label">
            Parol
            <input
              placeholder="Parol kiriting"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className="login-remember">
            <label className="login-last--label">
              <input type="checkbox" />
              Remember me
            </label>
            <p>Forgot password</p>
          </div>
          <button className="login-btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Signing in…' : 'Login'}
          </button>
          <p className="login-account">
            Akkauntingiz yo&apos;qmi? <Link to="/sign-up">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
