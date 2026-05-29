import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import TelegramSupportWidget from '../components/TelegramSupportWidget'
import { fetchStoreCategories } from '../features/catalog/catalogSlice'
import { fetchStoreSettings } from '../features/settings/settingsSlice'

const RootLayout = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchStoreCategories())
    dispatch(fetchStoreSettings())
  }, [dispatch])

  return (
    <div>
        <Nav/>
        <Header/>
        <Outlet/>
        <Footer/>
        <TelegramSupportWidget />
    </div>
  )
}

export default RootLayout
