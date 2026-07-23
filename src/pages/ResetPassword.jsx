import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '../services/authService'
import {
  getPasswordStrength,
  validatePassword,
} from '../utils/formValidation'
import '../assets/styles/login.scss'

const strengthLabels = {
  weak: 'Zaif',
  medium: "O'rtacha",
  strong: 'Kuchli',
}

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordCheck = useMemo(() => validatePassword(password), [password])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid reset link')
      return
    }

    if (!passwordCheck.isValid) {
      toast.error(passwordCheck.error)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      toast.success('Password reset successfully')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container">
        <div className="login">
          <h2 className="login-title">Havola yaroqsiz</h2>
          <p className="login-text">Parolni tiklash havolasi topilmadi yoki muddati tugagan.</p>
          <p className="login-account">
            <Link to="/forgot-password">Yangi havola so\'rash</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="login">
        <h2 className="login-title">Yangi parol</h2>
        <p className="login-text">Yangi parolingizni kiriting</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Yangi parol
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 8 belgi"
                required
                minLength={8}
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
            {password && (
              <span className="text-sm text-gray-500">
                Kuch: {strengthLabels[strength] || strength}
              </span>
            )}
          </label>

          <label className="login-label">
            Parolni tasdiqlang
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Parolni qayta kiriting"
              required
            />
          </label>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda…' : 'Parolni yangilash'}
          </button>
        </form>

        <p className="login-account">
          <Link to="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
