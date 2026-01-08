import React from 'react'
import "../assets/styles/banner.scss"
import { Link } from 'react-router-dom'
import BannerImg from "../assets/images/bannerImg.jpg"

const Banner = () => {
    const bannerMenus = [
        {
            title: "Woman's Fashion",
            path: '',
            arrow: "fa-solid fa-angle-right"
        },
        {
            title: "Men's Fashion",
            path: '',
            arrow: "fa-solid fa-angle-right"
        },
        {
            title: "Electronics",
            path: ''
        },
        {
            title: "Home & Lifestyle",
            path: ''
        },
        {
            title: "Medicine",
            path: ''
        },
        {
            title: "Sports & Outdoor",
            path: ''
        },
        {
            title: "Baby's & Toys",
            path: ''
        },
        {
            title: "Health & Beauty",
            path: ''
        },
    ]
  return (
    <div className='container'> 
        <div className="banner">
            <div className="banner-links">
                {
                    bannerMenus.map((menu)=>{
                        return <Link className='banner-link'>{menu.title}<i className={menu.arrow}/></Link>
                    })
                }
            </div>
            <div className="banner-wrapper">
                <div className="banner-info">
                    <p className='banner-text'><i class="fa-brands fa-apple"></i>Iphone 14 Series<img src="" alt="" /></p>
                    <h2 className='banner-title'>Up to 10% off Voucher</h2>
                    <Link to='/products' className='banner-route'>Shop Now<i class="fa-solid fa-arrow-right"></i></Link>
                </div>
                <div className="banner-img">
                    <img src={BannerImg} alt="" />
                </div>
            </div>
        </div>
    </div>
  )
}

export default Banner