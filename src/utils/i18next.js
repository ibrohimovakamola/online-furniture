import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import translationEn from "./locales/eng/translation.json"
import translationUz from "./locales/uz/translation.json"
import translationRu from "./locales/ru/translation.json"

const resources = {
    en: {
        translation: translationEn,
    },
    uz: {
        translation: translationUz,
    },
    ru: {
        translation: translationRu,
    },
}

i18n.use(initReactI18next).init({
    lng: "en",
    debug: true,
    fallbackLng: "en",
    resources,
    interpolation: {
        escapeValue: false,
    }
})

export default i18n;