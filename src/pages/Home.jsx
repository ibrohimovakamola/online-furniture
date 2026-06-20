import React from 'react'
import Banner from '../components/Banner'
import FlashSaleSection from '../components/FlashSaleSection'
import Category from '../components/Category'
import BestSellingProducts from '../components/BestSellingProducts'
import SecondBanner from '../components/SecondBanner'
import Features from '../components/Features'
import RecentlyViewedSection from '../features/kresla/components/home/RecentlyViewedSection'
import VideoTestimonials from '../features/kresla/components/home/VideoTestimonials'
import InstagramFeed from '../features/kresla/components/home/InstagramFeed'

const Home = () => {
  return (
    <div>
      <Banner />
      <FlashSaleSection />
      <Category />
      <RecentlyViewedSection />
      <BestSellingProducts />
      <VideoTestimonials />
      <SecondBanner />
      <InstagramFeed />
      <Features />
    </div>
  )
}

export default Home