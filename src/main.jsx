import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/product-customizer.scss'
import App from './App.jsx'
import './utils/i18next.js'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { attachTokenGetter } from './features/auth/authApi'

attachTokenGetter(() => store.getState().auth.token)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#1a2626', color: '#f0f4f4', border: '1px solid rgba(255,255,255,0.1)' },
        success: { iconTheme: { primary: '#5eead4', secondary: '#0b3c3c' } },
      }}
    />
  </Provider>,
)
