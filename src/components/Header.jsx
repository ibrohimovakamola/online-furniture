import { useEffect, useState } from 'react'
import '../assets/styles/header.scss'
import { Link, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import KreslaLogo from '../assets/images/logo1.jpg'
import HeaderPagesDropdown from './HeaderPagesDropdown'
import HeaderUserMenu from './HeaderUserMenu'
import SearchBar from './SearchBar'

const MOBILE_PAGE_LINKS = [
  { to: '/blog', labelKey: 'navigation:header.menu.blog' },
  { to: '/flash-sale', labelKey: 'navigation:header.menu.flashSale' },
  { to: '/gallery', labelKey: 'navigation:header.menu.gallery' },
  { to: '/faq', labelKey: 'navigation:header.menu.faq' },
  { to: '/showroom', labelKey: 'navigation:header.menu.showroom' },
]

const navLinkClass = ({ isActive }) =>
  ['header-menu', isActive ? 'header-menu--active' : ''].filter(Boolean).join(' ')

const Header = () => {
  const { t } = useTranslation(['navigation', 'common'])
  const { isAuthenticated, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartItems = useSelector((state) => state.cart.items)
  const cartCount = cartItems.length
  const favouriteItem = useSelector((state) => state.favourite.items)
  const favouriteCount = favouriteItem.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const menus = [
    { title: t('navigation:header.menu.home'), path: '/' },
    { title: t('navigation:header.menu.products'), path: '/products' },
    { title: t('navigation:header.menu.contact'), path: '/contact' },
    { title: t('navigation:header.menu.about'), path: '/about' },
  ]

  useEffect(() => {
    if (!mobileOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  const mobileNavClass = ({ isActive }) =>
    [
      'header-mobile-link',
      isActive ? 'header-mobile-link--active' : '',
    ].join(' ')

  return (
    <div className="header-shell">
      <div className="container">
        <div className="header">
          <Link to="/" className="header-logo shrink-0" onClick={closeMobile}>
            <img
              src={KreslaLogo}
              alt={t('common:brand')}
              className="h-12 w-auto object-contain sm:h-14 xl:h-16"
            />
          </Link>

          <ul className="header-menus header-menus--desktop">
            {menus.map((menu) => (
              <li key={menu.path} className="list-none">
                <NavLink to={menu.path} className={navLinkClass}>
                  {menu.title}
                </NavLink>
              </li>
            ))}
            <HeaderPagesDropdown />
            <li className="list-none">
              <NavLink to="/designer-portal" className={navLinkClass}>
                {t('navigation:header.menu.b2b')}
              </NavLink>
            </li>
            {isAdmin && (
              <li className="list-none">
                <NavLink to="/admin" className={navLinkClass}>
                  {t('navigation:header.menu.admin')}
                </NavLink>
              </li>
            )}
          </ul>

          <div className="header-actions">
            <SearchBar variant="header" className="header-search hidden min-w-0 md:flex md:flex-1" />

            <div className="header-icons">
              <Link
                to="/favourites"
                className="header-icon-btn header-wishlist"
                aria-label={t('navigation:header.wishlist')}
              >
                <i className="fa-regular fa-heart" />
                {favouriteCount > 0 && (
                  <span className="header-mark">{favouriteCount}</span>
                )}
              </Link>
              <Link
                to="/cart"
                className="header-icon-btn header-cart"
                aria-label={t('navigation:header.cart')}
              >
                <i className="fa-solid fa-cart-shopping" />
                {cartCount > 0 && <span className="header-mark">{cartCount}</span>}
              </Link>
            </div>

            <div className="header-auth header-auth--desktop">
              {isAuthenticated ? (
                <HeaderUserMenu />
              ) : (
                <>
                  <Link to="/login" className="header-btn header-btn--ghost">
                    {t('common:buttons.login')}
                  </Link>
                  <Link to="/sign-up" className="header-btn header-btn--primary">
                    {t('common:buttons.signUp')}
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="header-icon-btn header-menu-toggle"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className="header-search-mobile pb-3 md:hidden">
          <SearchBar variant="header" className="w-full" />
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="header-drawer-backdrop"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <nav className="header-drawer" aria-label="Mobile navigation">
            <div className="header-drawer-inner">
              {menus.map((menu) => (
                <NavLink
                  key={menu.path}
                  to={menu.path}
                  className={mobileNavClass}
                  onClick={closeMobile}
                >
                  {menu.title}
                </NavLink>
              ))}
              <p className="header-drawer-label">{t('navigation:header.pages')}</p>
              {MOBILE_PAGE_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={mobileNavClass}
                  onClick={closeMobile}
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <NavLink
                to="/designer-portal"
                className={mobileNavClass}
                onClick={closeMobile}
              >
                {t('navigation:header.menu.b2b')}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={mobileNavClass} onClick={closeMobile}>
                  {t('navigation:header.menu.admin')}
                </NavLink>
              )}

              <div className="header-auth header-auth--mobile">
                {isAuthenticated ? (
                  <>
                    <NavLink to="/profile" className={mobileNavClass} onClick={closeMobile}>
                      {t('navigation:header.account', { defaultValue: 'Profil' })}
                    </NavLink>
                    <NavLink to="/orders" className={mobileNavClass} onClick={closeMobile}>
                      {t('navigation:header.myOrders')}
                    </NavLink>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="header-btn header-btn--ghost header-btn--block"
                      onClick={closeMobile}
                    >
                      {t('common:buttons.login')}
                    </Link>
                    <Link
                      to="/sign-up"
                      className="header-btn header-btn--primary header-btn--block"
                      onClick={closeMobile}
                    >
                      {t('common:buttons.signUp')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </>
      ) : null}

      <div className="header-line" />
    </div>
  )
}

export default Header
