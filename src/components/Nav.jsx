import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settings/settingsSlice'
import LanguageSwitcher from './LanguageSwitcher'

function Nav() {
  const { t } = useTranslation('navigation')
  const settings = useSelector(selectSettings)
  const store = settings?.store

  return (
    <div className="nav">
      <div className="container">
        <div className="nav-wrapper">
          <p className="nav-phone">
            <i className="fa-solid fa-phone" aria-hidden />
            {store?.supportPhone || '+998 94 043 16 84'}
          </p>
          <p className="nav-text">
            {t('promo')}
            <Link to="/products" className="nav-link">
              {t('promoLink')}
            </Link>
          </p>
          <div className="select">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Nav
