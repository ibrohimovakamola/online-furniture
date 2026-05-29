import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, clearAuthError, selectAuth } from '../features/auth/authSlice'
import '../assets/styles/login.scss'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error } = useSelector(selectAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())

    const result = await dispatch(loginUser({ email, password }))

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user.role
      const isStaff = role === 'super_admin' || role === 'manager'
      navigate(isStaff ? (location.state?.from || '/admin') : '/', { replace: true })
    }
  }

  return (
    <div className='container'>
      <div className="login">
        <h2 className="login-title">Welcome back</h2>
        <p className="login-text">Akkauntingizga kirish uchun ma'lumotingizni kiriting</p>

        {error && (
          <p className="login-error" role="alert">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label className='login-label'>
            Email manzil
            <input
              placeholder='Email manzilingizni kiriting'
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className='login-label'>
            Parol
            <input
              placeholder='Parol kiriting'
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className='login-remember'>
            <label className='login-last--label'>
              <input type="checkbox" />
              Remember me
            </label>
            <p>Forgot password</p>
          </div>
          <button className="login-btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Signing in…' : 'Login'}
          </button>
          <p className='login-account'>
            Akkauntingiz yo'qmi? <Link to="/sign-up">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
