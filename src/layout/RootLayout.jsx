import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import TelegramSupportWidget from '../components/TelegramSupportWidget'
import { ToastProvider } from '../features/kresla/context/ToastContext'
import ScrollToTop from '../features/kresla/components/ScrollToTop'
import CompareBar from '../features/kresla/components/CompareBar'
import { fetchStoreCategories } from '../features/catalog/catalogSlice'
import { fetchStoreSettings } from '../features/settings/settingsSlice'

const RootLayout = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchStoreCategories())
    dispatch(fetchStoreSettings())
  }, [dispatch])

  return (
    <ToastProvider>
      <div>
        <Nav />
        <Header />
        <Outlet />
        <Footer />
        <TelegramSupportWidget />
        <ScrollToTop />
        <CompareBar />
      </div>
    </ToastProvider>
  )
}

export default RootLayout
