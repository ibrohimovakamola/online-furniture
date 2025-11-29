import React from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Nav from '../components/Nav'

const RootLayout = () => {
  return (
    <div>
        <Nav/>
        <Header/>
        <Outlet/>
        <Footer/>
    </div>
  )
}

export default RootLayout
