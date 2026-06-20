import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/product-customizer.scss'
import App from './App.jsx'
import './i18n/index.js'
import I18nLangSync from './i18n/I18nLangSync.jsx'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { attachTokenGetter, attachTokenRefreshedHandler, attachUnauthorizedHandler } from './features/auth/authApi'
import { logout, setAuthSession } from './features/auth/authSlice'
import { getStoredUser } from './features/auth/authStorage'
import { AuthProvider, triggerAuthSessionClear } from './features/auth/AuthContext'

attachTokenGetter(() => store.getState().auth.token)
attachTokenRefreshedHandler((token) => {
  const user = store.getState().auth.user || getStoredUser()
  if (user) store.dispatch(setAuthSession({ user, token }))
})
attachUnauthorizedHandler(() => {
  store.dispatch(logout())
  triggerAuthSessionClear()
})

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <AuthProvider>
      <I18nLangSync />
      <App />
    </AuthProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#1a2626', color: '#f0f4f4', border: '1px solid rgba(255,255,255,0.1)' },
        success: { iconTheme: { primary: '#5eead4', secondary: '#0b3c3c' } },
      }}
    />
  </Provider>,
)
