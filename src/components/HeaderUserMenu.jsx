import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import { logoutUser } from '../features/auth/authSlice'

function getUserInitials(user) {
  if (!user) return '?'

  const first = user.firstName?.trim()
  const last = user.lastName?.trim()
  if (first || last) {
    return [first, last]
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }

  const name = (user.name || user.fullName || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0][0]?.toUpperCase() || '?'
  }

  const email = user.email?.trim()
  if (email) return email[0].toUpperCase()

  return '?'
}

const HeaderUserMenu = () => {
  const { t } = useTranslation('navigation')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, clearSession } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const displayName =
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email

  const initials = getUserInitials(user)

  const handleLogout = async () => {
    setOpen(false)
    await dispatch(logoutUser())
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <div className="header-user-menu relative" ref={menuRef}>
      <button
        type="button"
        className="header-btn header-btn--user"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={displayName}
        title={displayName}
      >
        <span className="header-user-initials" aria-hidden="true">
          {initials}
        </span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-xs`} aria-hidden />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
          role="menu"
        >
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            {t('header.profile', { defaultValue: 'Profil' })}
          </Link>
          <Link
            to="/orders"
            className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            {t('header.myOrders', { defaultValue: 'Buyurtmalarim' })}
          </Link>
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            {t('header.settings', { defaultValue: 'Sozlamalar' })}
          </Link>
          <hr className="my-1 border-gray-100" />
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            onClick={handleLogout}
            role="menuitem"
          >
            {t('header.logout', { defaultValue: 'Chiqish' })}
          </button>
        </div>
      )}
    </div>
  )
}

export default HeaderUserMenu
