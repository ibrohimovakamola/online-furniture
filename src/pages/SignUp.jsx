import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import Mebel4 from '../assets/images/reg3.jpg'
import '../assets/styles/sign-up.scss'
import { registerUser, clearAuthError, selectAuth } from '../features/auth/authSlice'
import { useAuth } from '../features/auth/AuthContext'
import {
  getPasswordStrength,
  normalizeUzPhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhoneNumber,
} from '../utils/formValidation'

const strengthLabels = { weak: 'Zaif', medium: "O'rtacha", strong: 'Kuchli' }

const SignUp = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector(selectAuth)
  const { syncSession } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '+998',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'uz',
    acceptTerms: false,
    newsletter: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    const firstNameCheck = validateName(form.firstName, 'First name')
    const lastNameCheck = validateName(form.lastName, 'Last name')
    const emailCheck = validateEmail(form.email)
    const phoneCheck = validatePhoneNumber(form.phoneNumber)
    const passwordCheck = validatePassword(form.password)

    if (!firstNameCheck.isValid) errors.firstName = firstNameCheck.error
    if (!lastNameCheck.isValid) errors.lastName = lastNameCheck.error
    if (!emailCheck.isValid) errors.email = emailCheck.error
    if (!phoneCheck.isValid) errors.phoneNumber = phoneCheck.error
    if (!passwordCheck.isValid) errors.password = passwordCheck.error
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!form.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    const phone = normalizeUzPhone(form.phoneNumber)

    const result = await dispatch(
      registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone,
        phoneNumber: phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        preferredLanguage: form.preferredLanguage,
        preferences: {
          newsletter: form.newsletter,
          notifications: true,
        },
      })
    )

    if (registerUser.fulfilled.match(result)) {
      if (result.payload?.requiresVerification) {
        toast.success(result.payload.message || 'Check your email to verify your account')
        navigate('/verify-email', {
          replace: true,
          state: { email: form.email.trim().toLowerCase() },
        })
        return
      }

      syncSession(result.payload.user, result.payload.token)
      toast.success('Account created successfully!')
      navigate('/', { replace: true })
    } else {
      const payload = result.payload
      if (payload && typeof payload === 'object' && payload.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...payload.fieldErrors }))
        toast.error(payload.message || 'Registration failed')
      } else {
        toast.error(payload || 'Registration failed')
      }
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
              Ro&apos;yxatdan o&apos;tish uchun kerakli ma&apos;lumotlarni kiriting
            </p>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <form className="registr-form" onSubmit={handleSubmit} noValidate>
              <label>
                Ism
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Ismingiz"
                  type="text"
                  required
                />
                {fieldErrors.firstName && <span className="text-red-500 text-sm">{fieldErrors.firstName}</span>}
              </label>
              <label>
                Familiya
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Familiyangiz"
                  type="text"
                  required
                />
                {fieldErrors.lastName && <span className="text-red-500 text-sm">{fieldErrors.lastName}</span>}
              </label>
              <label>
                Email manzil
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email kiriting"
                  type="email"
                  required
                />
                {fieldErrors.email && <span className="text-red-500 text-sm">{fieldErrors.email}</span>}
              </label>
              <label>
                Telefon (+998)
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="+998901234567"
                  type="tel"
                  required
                />
                {fieldErrors.phoneNumber && (
                  <span className="text-red-500 text-sm">{fieldErrors.phoneNumber}</span>
                )}
              </label>
              <label>
                Til
                <select
                  name="preferredLanguage"
                  value={form.preferredLanguage}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="uz">O&apos;zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                Parol
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Parol kiriting"
                    type={showPassword ? 'text' : 'password'}
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
                    }}
                  >
                    {showPassword ? 'Yashirish' : 'Ko\'rish'}
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  Kamida 8 belgi, katta/kichik harf, raqam va maxsus belgi (! @ #)
                </span>
                {form.password && (
                  <span className="text-sm text-gray-500">
                    Kuch: {strengthLabels[passwordStrength]}
                  </span>
                )}
                {fieldErrors.password && <span className="text-red-500 text-sm">{fieldErrors.password}</span>}
              </label>
              <label>
                Parolni tasdiqlang
                <input
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Parolni tasdiqlang"
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                {fieldErrors.confirmPassword && (
                  <span className="text-red-500 text-sm">{fieldErrors.confirmPassword}</span>
                )}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="acceptTerms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                />
                <span>
                  <Link to="/terms-of-service" target="_blank">
                    Foydalanish shartlari
                  </Link>
                  ga roziman
                </span>
              </label>
              {fieldErrors.acceptTerms && (
                <span className="text-red-500 text-sm">{fieldErrors.acceptTerms}</span>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="newsletter"
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={handleChange}
                />
                Yangiliklar va aksiyalar haqida xabar olish
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
