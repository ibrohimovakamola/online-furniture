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
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (location.state?.from === '/admin' || location.state?.adminDenied) {
      setEmail('admin@kresla.uz')
    }
  }, [location.state?.from, location.state?.adminDenied])

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())

    const result = await dispatch(
      loginUser({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      })
    )

    if (loginUser.fulfilled.match(result)) {
      const userData = result.payload.user
      const authToken = result.payload.token

      syncSession(userData, authToken)

      if (isAdminRole(userData.role)) {
        navigate(location.state?.from || '/admin', { replace: true })
      } else {
        navigate(location.state?.from || '/', { replace: true })
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
            Admin panel: <strong>admin@kresla.uz</strong> / <strong>ChangeMe123!</strong>
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
            {error.toLowerCase().includes('verify') && (
              <p className="login-error-hint">
                <Link to="/verify-email">Emailni tasdiqlash sahifasi</Link>
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
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Parol kiriting"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0b3c3c',
                }}
              >
                {showPassword ? 'Yashirish' : 'Ko\'rish'}
              </button>
            </div>
          </label>
          <div className="login-remember">
            <label className="login-last--label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <p>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
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
