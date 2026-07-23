import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resendVerification, verifyEmailToken } from '../services/authService'
import '../assets/styles/login.scss'

const RESEND_COOLDOWN_SEC = 60

const VerifyEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token') || ''

  const [email, setEmail] = useState('')
  const [token, setToken] = useState(urlToken)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!urlToken) return

    const run = async () => {
      setLoading(true)
      try {
        await verifyEmailToken(urlToken)
        setVerified(true)
        toast.success('Email verified successfully')
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      } catch (err) {
        toast.error(err.message || 'Verification failed')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [urlToken, navigate])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error('Verification token is required')
      return
    }

    setLoading(true)
    try {
      await verifyEmailToken(token.trim())
      setVerified(true)
      toast.success('Email verified successfully')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address')
      return
    }
    if (cooldown > 0) return

    try {
      await resendVerification(email.trim().toLowerCase())
      toast.success('Verification email sent')
      setCooldown(RESEND_COOLDOWN_SEC)
    } catch (err) {
      toast.error(err.message || 'Failed to resend email')
    }
  }

  return (
    <div className="container">
      <div className="login">
        <h2 className="login-title">Emailni tasdiqlash</h2>

        {verified ? (
          <p className="login-text">Email muvaffaqiyatli tasdiqlandi. Login sahifasiga yo\'naltirilmoqdasiz…</p>
        ) : (
          <>
            <p className="login-text">
              Ro&apos;yxatdan o&apos;tganingizdan so&apos;ng email manzilingizga tasdiqlash havolasi yuborildi.
              Havoladagi kodni kiriting yoki emailni qayta yuboring.
            </p>

            <form onSubmit={handleVerify} className="login-form">
              <label className="login-label">
                Email manzil
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email manzilingiz"
                />
              </label>

              <label className="login-label">
                Tasdiqlash kodi
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Havoladagi token"
                  required={!urlToken}
                />
              </label>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Tekshirilmoqda…' : 'Emailni tasdiqlash'}
              </button>
            </form>

            <div className="login-remember" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="login-btn"
                style={{ width: 'auto', padding: '0.5rem 1rem', opacity: cooldown > 0 ? 0.6 : 1 }}
                onClick={handleResend}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : 'Havolani qayta yuborish'}
              </button>
            </div>
          </>
        )}

        <p className="login-account">
          <Link to="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyEmail
