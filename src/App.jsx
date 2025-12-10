import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import RootLayout from './layout/RootLayout'
import Home from './pages/Home'
import Contact from './pages/Contact'
import About from './pages/About'
import NotFound from './pages/NotFound'
import SignUp from './pages/SignUp'
import Cart from './pages/Cart'
import Fovourites from './pages/Fovourites'
import Product from './pages/Product'
import ProductLayout from './layout/ProductLayout'
import ProductDetail from './pages/ProductDetail'


function App() {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout/>}>
        <Route index element={<Home/>}/>
        <Route path='contact' element={<Contact/>}/>
        <Route path='about' element={<About/>}/>
        <Route path='sign-up' element={<SignUp/>}/>
        <Route path='products' element={<ProductLayout/>}>
        <Route index element={<Product/>}/>
        <Route path=':id' element={<ProductDetail/>}/>
        </Route>
        <Route path='cart' element={<Cart/>}/>
        <Route path='favourites' element={<Fovourites/>}/>
        <Route path='*' element={<NotFound/>}/>

      </Route>
    )
  )



  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
