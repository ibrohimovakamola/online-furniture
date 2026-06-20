import '../assets/styles/header.scss'
import { Link, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import exclusiveLogo from '../assets/images/logo1.jpg'
import HeaderPagesDropdown from './HeaderPagesDropdown'
import SearchBar from './SearchBar'

const Header = () => {
  const { t } = useTranslation(['navigation', 'common'])
  const { isAuthenticated, isAdmin } = useAuth()
  const cartItems = useSelector((state) => state.cart.items)
  const cartCount = cartItems.length
  const favouriteItem = useSelector((state) => state.favourite.items)
  const favouriteCount = favouriteItem.reduce(
    (total, item) => total + item.quantity,
    0
  )
  const menus = [
    { title: t('navigation:header.menu.home'), path: '/' },
    { title: t('navigation:header.menu.contact'), path: '/contact' },
    { title: t('navigation:header.menu.about'), path: '/about' },
  ]

  return (
    <div>
      <div className="container">
        <div className="header">
          <Link to="/" className="header-logo shrink-0">
            <img
              src={exclusiveLogo}
              alt={t('common:brand')}
              className="h-20 w-auto object-contain"
            />
          </Link>
          <ul className="header-menus flex items-center gap-1 flex-wrap">
            {menus.map((menu) => (
              <li key={menu.path} className="list-none">
                <NavLink to={menu.path} className="header-menu">
                  {menu.title}
                </NavLink>
              </li>
            ))}
            <HeaderPagesDropdown />
            <li className="list-none">
              <NavLink to="/designer-portal" className="header-menu">
                {t('navigation:header.menu.b2b')}
              </NavLink>
            </li>
            {isAdmin ? (
              <li className="list-none">
                <NavLink to="/admin" className="header-menu header-menu--admin">
                  {t('navigation:header.menu.admin')}
                </NavLink>
              </li>
            ) : (
              <li className="list-none">
                <NavLink to={isAuthenticated ? '/orders' : '/login'} className="header-menu">
                  {isAuthenticated
                    ? t('navigation:header.myOrders')
                    : t('common:buttons.login')}
                </NavLink>
              </li>
            )}
            {!isAuthenticated && (
              <li className="list-none">
                <NavLink to="/sign-up" className="header-menu">
                  {t('common:buttons.signUp')}
                </NavLink>
              </li>
            )}
          </ul>
          <div className="header-info min-w-0 flex-1 justify-end">
            <SearchBar variant="header" className="min-w-[220px] flex-1" />
            <Link to="/favourites" className="header-wishlist" aria-label={t('navigation:header.wishlist')}>
              <i className="fa-regular fa-heart" />
              {favouriteCount > 0 && (
                <span className="header-mark">{favouriteCount}</span>
              )}
            </Link>
            <Link to="/cart" className="header-cart" aria-label={t('navigation:header.cart')}>
              <i className="fa-solid fa-cart-shopping" />
              {cartCount > 0 && <span className="header-mark">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </div>
      <div className="header-line" />
    </div>
  )
}

export default Header
