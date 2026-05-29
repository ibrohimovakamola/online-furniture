import React from 'react'
import Banner from '../components/Banner'
import FlashSaleSection from '../components/FlashSaleSection'
import Category from '../components/Category'
import BestSellingProducts from '../components/BestSellingProducts'
import SecondBanner from '../components/SecondBanner'
import Features from '../components/Features'

const Home = () => {
  return (
    <div>
      <Banner />
      <FlashSaleSection />
      <Category />
      <BestSellingProducts />
      <SecondBanner />
      <Features />
    </div>
  )
}

export default Home