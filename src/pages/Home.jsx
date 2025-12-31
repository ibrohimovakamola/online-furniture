import React from 'react'
import Banner from '../components/Banner'
import Products from '../components/Products'
import Category from '../components/Category'
import SecondBanner from '../components/SecondBanner'
import Features from '../components/Features'

const Home = () => {
  return (
    <div>
      <Banner/>
      <Products/>
      <Category/>
      <SecondBanner/>
      <Features/>
      {/* <Products/> */}
    </div>
  )
}

export default Home