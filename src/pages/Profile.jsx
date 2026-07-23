import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { useAuth } from '../features/auth/AuthContext'
import { fetchCurrentUser, logoutUser } from '../features/auth/authSlice'
import {
  changeUserPassword,
  deleteAccount as deleteAccountApi,
  updateUserProfile,
} from '../services/authService'
import {
  normalizeUzPhone,
  validatePassword,
  validatePhoneNumber,
} from '../utils/formValidation'
import '../assets/styles/login.scss'

const emptyAddress = { street: '', city: '', region: '', postalCode: '' }

const Profile = () => {
  const dispatch = useDispatch()
  const { user, token, syncSession, clearSession } = useAuth()

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    preferredLanguage: 'uz',
    address: emptyAddress,
    preferences: { newsletter: false, notifications: true },
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setProfile({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phone || user.phoneNumber || '',
      preferredLanguage: user.preferredLanguage || 'uz',
      address: { ...emptyAddress, ...(user.address || {}) },
      preferences: {
        newsletter: Boolean(user.preferences?.newsletter),
        notifications: user.preferences?.notifications !== false,
      },
    })
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setProfile((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }))
      return
    }
    if (name.startsWith('preferences.')) {
      const key = name.split('.')[1]
      setProfile((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: type === 'checkbox' ? checked : value },
      }))
      return
    }
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const phoneCheck = validatePhoneNumber(profile.phoneNumber)
    if (!phoneCheck.isValid) {
      toast.error(phoneCheck.error)
      return
    }

    setSaving(true)
    try {
      const updated = await updateUserProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phoneNumber: normalizeUzPhone(profile.phoneNumber),
        preferredLanguage: profile.preferredLanguage,
        address: profile.address,
        preferences: profile.preferences,
      })
      syncSession(updated, token)
      dispatch(fetchCurrentUser())
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const check = validatePassword(passwords.newPassword)
    if (!check.isValid) {
      toast.error(check.error)
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await changeUserPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      })
      toast.success('Password updated')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.')
    if (!confirmed) return

    const password = window.prompt('Enter your password to confirm deletion:')
    if (!password) return

    try {
      await deleteAccountApi({ password })
      await dispatch(logoutUser())
      clearSession()
      toast.success('Account deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete account')
    }
  }

  if (!user) return null

  return (
    <div className="container py-10">
      <div className="login" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 className="login-title">Profil</h2>
        <p className="login-text">{user.email}</p>

        <form onSubmit={handleSaveProfile} className="login-form">
          <label className="login-label">
            Ism
            <input name="firstName" value={profile.firstName} onChange={handleProfileChange} required />
          </label>
          <label className="login-label">
            Familiya
            <input name="lastName" value={profile.lastName} onChange={handleProfileChange} required />
          </label>
          <label className="login-label">
            Telefon
            <input name="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange} />
          </label>
          <label className="login-label">
            Til
            <select
              name="preferredLanguage"
              value={profile.preferredLanguage}
              onChange={handleProfileChange}
              className="w-full rounded border px-3 py-2"
            >
              <option value="uz">O&apos;zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="login-label">
            Ko&apos;cha
            <input
              name="address.street"
              value={profile.address.street}
              onChange={handleProfileChange}
            />
          </label>
          <label className="login-label">
            Shahar
            <input name="address.city" value={profile.address.city} onChange={handleProfileChange} />
          </label>
          <label className="login-label">
            Viloyat
            <input name="address.region" value={profile.address.region} onChange={handleProfileChange} />
          </label>
          <label className="login-label">
            Pochta indeksi
            <input
              name="address.postalCode"
              value={profile.address.postalCode}
              onChange={handleProfileChange}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="preferences.newsletter"
              checked={profile.preferences.newsletter}
              onChange={handleProfileChange}
            />
            Yangiliklar xabarnomasi
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="preferences.notifications"
              checked={profile.preferences.notifications}
              onChange={handleProfileChange}
            />
            Bildirishnomalar
          </label>
          <button className="login-btn" type="submit" disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </form>

        <hr className="my-8" />

        <h3 className="text-lg font-semibold mb-4">Parolni o&apos;zgartirish</h3>
        <form onSubmit={handleChangePassword} className="login-form">
          <label className="login-label">
            Joriy parol
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </label>
          <label className="login-label">
            Yangi parol
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </label>
          <label className="login-label">
            Parolni tasdiqlang
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          </label>
          <button className="login-btn" type="submit" disabled={saving}>
            Parolni yangilash
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/orders" className="text-[#0b3c3c] underline">
            Buyurtmalarim
          </Link>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="text-red-600 underline"
          >
            Akkauntni o&apos;chirish
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
