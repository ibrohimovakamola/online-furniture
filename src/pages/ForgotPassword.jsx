import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forgotPassword } from '../services/authService'
import '../assets/styles/login.scss'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await forgotPassword(email.trim().toLowerCase())
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="login">
        <h2 className="login-title">Parolni tiklash</h2>
        <p className="login-text">
          {sent
            ? 'Agar email ro\'yxatdan o\'tgan bo\'lsa, parolni tiklash havolasi yuborildi.'
            : 'Email manzilingizni kiriting — parolni tiklash havolasini yuboramiz.'}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              Email manzil
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email manzilingiz"
                required
              />
            </label>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Yuborilmoqda…' : 'Havola yuborish'}
            </button>
          </form>
        )}

        <p className="login-account">
          <Link to="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
