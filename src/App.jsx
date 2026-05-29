// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
// import RootLayout from './layout/RootLayout'
// import Home from './pages/Home'
// import Contact from './pages/Contact'
// import About from './pages/About'
// import NotFound from './pages/NotFound'
// import SignUp from './pages/SignUp'
// import Cart from './pages/Cart'
// import Fovourites from './pages/Fovourites'
// import Product from './pages/Product'
// import ProductLayout from './layout/ProductLayout'
// import ProductDetail from './pages/ProductDetail'



// function App() {

//   const router = createBrowserRouter(
//     createRoutesFromElements( 
      
//       <Route path='/' element={<RootLayout/>}>
//         <Route index element={<Home/>}/>
//         <Route path='contact' element={<Contact/>}/>
//         <Route path='about' element={<About/>}/>
//         <Route path='sign-up' element={<SignUp/>}/>
//         <Route path='products' element={<ProductLayout/>}>
//         <Route index element={<Product/>}/>
//         <Route path=':id' element={<ProductDetail/>}/>
//         </Route>
//         <Route path='cart' element={<Cart/>}/>
//         <Route path='favourites' element={<Fovourites/>}/>
//         <Route path='*' element={<NotFound/>}/>

//       </Route>
//     )
//   )


//   return (
  
//     <>
      
//       <RouterProvider router={router}/>
//     </>
//   )
// }

// export default App


import './App.css'

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'

import RootLayout from './layout/RootLayout'
import ProductLayout from './layout/ProductLayout'

import Home from './pages/Home'
import Contact from './pages/Contact'
import About from './pages/About'
import SignUp from './pages/SignUp'
import Cart from './pages/Cart'
import Fovourites from './pages/Fovourites'
import Product from './pages/Product'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import ErrorPage from './pages/ErrorPage'

/* AUTH GUARDS */
import AuthInitializer from './features/auth/components/AuthInitializer'
import { AdminRouteGuard, GuestRoute } from './features/auth/components/RouteGuards'

/* ADMIN */
import AdminLayout from './features/admin/layout/AdminLayout'

import Dashboard from './features/admin/pages/Dashboard'
import ProductsAdmin from './features/admin/pages/ProductsAdmin'
import CategoriesAdmin from './features/admin/pages/CategoriesAdmin'
import OrdersAdmin from './features/admin/pages/OrdersAdmin'
import CustomersAdmin from './features/admin/pages/CustomersAdmin'
import FlashSaleAdmin from './features/admin/pages/FlashSaleAdmin'
import AnalyticsAdmin from './features/admin/pages/AnalyticsAdmin'
import SettingsAdmin from './features/admin/pages/SettingsAdmin'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<ErrorPage />}>
        {/* WEBSITE */}
        <Route path='/' element={<RootLayout />}>
          <Route index element={<Home />} />

          <Route path='contact' element={<Contact />} />

          <Route path='about' element={<About />} />

          <Route element={<GuestRoute />}>
            <Route path='login' element={<Login />} />
            <Route path='sign-up' element={<SignUp />} />
          </Route>

          <Route path='products' element={<ProductLayout />}>
            <Route index element={<Product />} />

            <Route path=':id' element={<ProductDetail />} />
          </Route>

          <Route path='category/:categoryId' element={<ProductLayout />}>
            <Route index element={<Product />} />
          </Route>

          <Route path='cart' element={<Cart />} />

          <Route path='favourites' element={<Fovourites />} />

          <Route path='*' element={<NotFound />} />
        </Route>

        {/* ADMIN PANEL — RBAC guarded */}
        <Route element={<AdminRouteGuard />}>
          <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path='products' element={<ProductsAdmin />} />
            <Route path='categories' element={<CategoriesAdmin />} />
            <Route path='orders' element={<OrdersAdmin />} />
            <Route path='customers' element={<CustomersAdmin />} />
            <Route path='flash-sale' element={<FlashSaleAdmin />} />
            <Route path='analytics' element={<AnalyticsAdmin />} />
            <Route path='settings' element={<SettingsAdmin />} />
          </Route>
        </Route>
      </Route>
    )
  )

  return (
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  )
}

export default App