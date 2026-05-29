import i18n from "i18next";

import { initReactI18next } from "react-i18next";


i18n.use(initReactI18next).init({
    resources:{
        uz:{
            translation:{
                greeting: "Salom",
                button: "bosish"
            }
        },
        en:{
            translation:{
                greeting: "Hello",
                button: "Click"
            }
        }
    },
    lng: "uz",
    fallbackLng: "uz"
})

export default i18n