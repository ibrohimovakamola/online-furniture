import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import Mebel4 from '../assets/images/reg3.jpg'
import '../assets/styles/sign-up.scss'
import { registerUser, clearAuthError, selectAuth } from '../features/auth/authSlice'

const SignUp = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector(selectAuth)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const result = await dispatch(
      registerUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      })
    )

    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created successfully!')
      navigate('/', { replace: true })
    } else {
      toast.error(result.payload || 'Registration failed')
    }
  }

  return (
    <div className="registr">
      <Toaster position="top-right" />
      <div className="container">
        <div className="registr-wrapper">
          <div className="registr-left">
            <h2 className="registr-title">Create an account</h2>
            <p className="registr-text">
              Ro'yxatdan o'tish uchun kerakli ma'lumotlarni kiriting
            </p>
            {error && <p className="login-error" role="alert">{error}</p>}
            <form className="registr-form" onSubmit={handleSubmit}>
              <label>
                Ism
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ismingiz" type="text" required />
              </label>
              <label>
                Familiya
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Familiyangiz" type="text" required />
              </label>
              <label>
                Email manzil
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email kiriting" type="email" required />
              </label>
              <label>
                Parol
                <input name="password" value={form.password} onChange={handleChange} placeholder="Parol kiriting" type="password" required minLength={8} />
              </label>
              <label>
                Parolni tasdiqlang
                <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Parolni tasdiqlang" type="password" required />
              </label>
              <button className="registr-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Creating account…' : 'Akkaunt yaratish'}
              </button>
              <p className="registr-login--text">
                Akkauntingiz bormi? <Link to="/login">Login</Link>
              </p>
            </form>
          </div>
          <div className="registr-right">
            <img src={Mebel4} alt="Furniture" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
