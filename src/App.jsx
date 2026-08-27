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
import LegalPage from './pages/LegalPage'
import SignUp from './pages/SignUp'
import Cart from './pages/Cart'
import Fovourites from './pages/Fovourites'
import Product from './pages/Product'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import ErrorPage from './pages/ErrorPage'
import Showroom from './pages/Showroom'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import FlashSalePage from './pages/FlashSalePage'
import Gallery from './pages/Gallery'
import DesignerPortal from './pages/DesignerPortal'
import Faq from './pages/Faq'
import Compare from './pages/Compare'
import Reviews from './pages/Reviews'
import Search from './pages/Search'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import PaymentResult from './pages/PaymentResult'
import TrackOrder from './pages/TrackOrder'

/* AUTH */
import { GuestRoute, ProtectedRoute } from './features/auth/components/RouteGuards'

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
import GalleryManagement from './features/admin/pages/GalleryManagement'
import B2BLeads from './features/admin/pages/B2BLeads'
import FAQManagement from './features/admin/pages/FAQManagement'
import CMSPageEditor from './features/admin/pages/CMSPageEditor'
import CMSPagePreview from './features/admin/pages/CMSPagePreview'
import PagesManagement from './features/admin/pages/PagesManagement'
import BlogsAdmin from './features/admin/pages/BlogsAdmin'
import BlogEditorAdmin from './features/admin/pages/BlogEditorAdmin'
import BlogCategoriesAdmin from './features/admin/pages/BlogCategoriesAdmin'
import BlogAnalyticsAdmin from './features/admin/pages/BlogAnalyticsAdmin'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<ErrorPage />}>
        {/* ADMIN PANEL — register before storefront so /admin/* never hits the storefront catch-all */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="customers" element={<CustomersAdmin />} />
            <Route path="flash-sale" element={<FlashSaleAdmin />} />
            <Route path="gallery" element={<GalleryManagement />} />
            <Route path="b2b-leads" element={<B2BLeads />} />
            <Route path="faq" element={<FAQManagement />} />
            <Route path="pages" element={<PagesManagement />} />
            <Route path="pages/new" element={<CMSPageEditor />} />
            <Route path="pages/edit/:slug" element={<CMSPageEditor />} />
            <Route path="pages/:slug/preview" element={<CMSPagePreview />} />
            <Route path="blog/new" element={<BlogEditorAdmin />} />
            <Route path="blog/edit/:id" element={<BlogEditorAdmin />} />
            <Route path="blog/categories" element={<BlogCategoriesAdmin />} />
            <Route path="blog/analytics" element={<BlogAnalyticsAdmin />} />
            <Route path="blog" element={<BlogsAdmin />} />
            <Route path="analytics" element={<AnalyticsAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
          </Route>
        </Route>

        {/* WEBSITE — pathless layout: only renders when a child route matches (not /admin/*) */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />

          <Route path="contact" element={<Contact />} />

          <Route path="about" element={<LegalPage slug="about" />} />
          <Route path="privacy-policy" element={<LegalPage slug="privacy-policy" />} />
          <Route path="terms-of-service" element={<LegalPage slug="terms-of-service" />} />
          <Route path="returns" element={<LegalPage slug="returns" />} />

          <Route element={<GuestRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="sign-up" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          <Route path="verify-email" element={<VerifyEmail />} />

          <Route path="products" element={<ProductLayout />}>
            <Route index element={<Product />} />

            <Route path=":id" element={<ProductDetail />} />
          </Route>

          <Route path="category/:categoryId" element={<ProductLayout />}>
            <Route index element={<Product />} />
          </Route>

          <Route path="cart" element={<Cart />} />
          <Route path="payment/result" element={<PaymentResult />} />
          <Route path="track/:token" element={<TrackOrder />} />

          <Route path="favourites" element={<Fovourites />} />

          <Route path="search" element={<Search />} />

          <Route path="showroom" element={<Showroom />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="flash-sale" element={<FlashSalePage />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="designer-portal/*" element={<DesignerPortal />} />
          <Route path="faq" element={<Faq />} />
          <Route path="compare" element={<Compare />} />
          <Route path="reviews" element={<Reviews />} />

          <Route element={<ProtectedRoute />}>
            <Route path="orders" element={<MyOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    )
  )

  return <RouterProvider router={router} />
}

export default App