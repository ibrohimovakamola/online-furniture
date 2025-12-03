import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Nav = () => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleSelect = () => {
    setIsSelectOpen((prev) => !prev);
  };
  const handleLang = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="nav">
      <div className="container">
        <div className="nav-wrapper">
          <p className="nav-text">
            Summer sale for all swim suits and free express delivery - OFF 50%
            <a href="" className="nav-link">
              ShopNow
            </a>
          </p>
          <div className={`select ${isSelectOpen ? "active" : ""}`}>
            <select
              className="nav-link"
              name="format"
              id="format"
              onClick={toggleSelect}
              onBlur={() => setIsSelectOpen(false)}
              defaultValue={i18n.language}
              onChange={handleLang}
            >
              <option value="uz">{t('uz')}</option>
              <option value="en">{t('en')}</option>
              <option value="ru">{t('ru')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
