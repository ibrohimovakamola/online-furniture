import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settings/settingsSlice'

const PROMO_TEXT =
  "Toshkent shahar ichida yetkazib berish va o'rnatish mutlaqo bepul!"

function Nav() {
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const settings = useSelector(selectSettings)
  const store = settings?.store

  const handleLang = (e) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <div className="nav">
      <div className="container">
        <div className="nav-wrapper">
          <p className="nav-phone">
            <i className="fa-solid fa-phone" aria-hidden />
            {store?.supportPhone || '+998 94 043 16 84'}
          </p>
          <p className="nav-text">
            {PROMO_TEXT}
            <Link to="/products" className="nav-link">
              Hozir xarid qiling
            </Link>
          </p>
          <div className={`select ${isSelectOpen ? 'active' : ''}`}>
            <select
              className="nav-lang"
              name="format"
              id="format"
              onClick={() => setIsSelectOpen((prev) => !prev)}
              onBlur={() => setIsSelectOpen(false)}
              value={i18n.language}
              onChange={handleLang}
              aria-label="Tilni tanlash"
            >
              <option value="uz">{t('uz')}</option>
              <option value="en">{t('en')}</option>
              <option value="ru">{t('ru')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Nav
