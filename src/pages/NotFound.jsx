import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../assets/styles/notfound.scss'
import BreadCrumbs from '../components/BreadCrumbs'

const NotFound = () => {
  const { t } = useTranslation('errors')

  return (
    <div className="container">
      <div>
        <BreadCrumbs />
        <div className="notfound">
          <h2 className="notfound-title">{t('404.title')}</h2>
          <p className="notfound-text">{t('404.message')}</p>
          <Link to="/" className="notfound-btn">
            {t('404.button')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
