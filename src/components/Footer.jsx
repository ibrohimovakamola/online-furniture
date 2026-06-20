import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import '../assets/styles/footer.scss'
import QrCode from '../assets/images/qr.jpg'
import { selectSettings } from '../features/settings/settingsSlice'

const Footer = () => {
  const { t } = useTranslation(['navigation', 'common'])
  const settings = useSelector(selectSettings)
  const store = settings?.store
  const year = new Date().getFullYear()

  const supports = [
    { title: store?.address || 'Tashkent, Uzbekistan' },
    { title: store?.storeEmail || 'exclusive@gmail.com' },
    { title: store?.supportPhone || '+998 94 043 16 84' },
  ]

  const accounts = [
    { title: t('navigation:footer.myAccount'), path: '/sign-up' },
    { title: t('navigation:footer.loginRegister'), path: '/login' },
    { title: t('navigation:footer.cart'), path: '/cart' },
    { title: t('navigation:footer.wishlist'), path: '/favourites' },
    { title: t('navigation:footer.shop'), path: '/products' },
  ]

  const quickLinks = [
    { title: t('navigation:footer.privacy'), path: '/privacy-policy' },
    { title: t('navigation:footer.terms'), path: '/terms-of-service' },
    { title: t('navigation:footer.faq'), path: '/faq' },
    { title: t('navigation:footer.contact'), path: '/contact' },
  ]

  return (
    <div className="footer-wrapper">
      <div className="container">
        <div className="footer">
          <div className="footer-column">
            <h4 className="footer-logo">{t('common:brand')}</h4>
            <p className="footer-link">{t('navigation:footer.subscribe')}</p>
            <p className="footer-link">{t('navigation:footer.subscribeHint')}</p>
            <div className="footer-form">
              <input placeholder={t('navigation:footer.emailPlaceholder')} type="email" />
              <button type="button" aria-label={t('navigation:footer.subscribe')}>
                <i className="fa-regular fa-paper-plane" />
              </button>
            </div>
          </div>
          <ul className="footer-column">
            <h4 className="footer-title">{t('navigation:footer.support')}</h4>
            {supports.map((support, i) => (
              <li key={i} className="footer-link">
                {support.title}
              </li>
            ))}
          </ul>
          <ul className="footer-column">
            <h4 className="footer-title">{t('navigation:footer.account')}</h4>
            {accounts.map((account) => (
              <Link key={account.path} to={account.path} className="footer-link">
                {account.title}
              </Link>
            ))}
          </ul>
          <ul className="footer-column">
            <h4 className="footer-title">{t('navigation:footer.links')}</h4>
            {quickLinks.map((link) => (
              <Link key={link.path} to={link.path} className="footer-link">
                {link.title}
              </Link>
            ))}
          </ul>
          <div className="footer-column">
            <h4 className="footer-title">{t('navigation:footer.follow')}</h4>
            <div className="footer-socials">
              {store?.instagram ? (
                <a href={store.instagram} target="_blank" rel="noreferrer">
                  <i className="fa-brands fa-instagram" />
                </a>
              ) : (
                <a href="/">
                  <i className="fa-brands fa-instagram" />
                </a>
              )}
              {store?.telegram ? (
                <a href={store.telegram} target="_blank" rel="noreferrer">
                  <i className="fa-brands fa-telegram" />
                </a>
              ) : (
                <a href="/">
                  <i className="fa-brands fa-telegram" />
                </a>
              )}
              <a href="/">
                <i className="fa-brands fa-facebook-f" />
              </a>
            </div>
            <p className="footer-link footer-link--mini mt-4">
              {t('navigation:footer.copyright', { year })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer
