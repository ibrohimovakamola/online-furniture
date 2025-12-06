// import React from 'react'
// import useFetch from '../hook/useFetch.js'
// import ProductCard from './ProductCard'
// import "../assets/styles/products.scss"

// const Products = () => {
//     const {state} = useFetch("products")
//     console.log(state)
//   return (
//     <div className='container'>
//         <div>
//             <button>Left</button>
//             <button>Right</button>
//         <div className='product-cards'>
//             {
//                 state?.products?.map((item)=>{
//                     return (
//                         <ProductCard product={item}/>
//                     )
//                 })
//             }
//         </div>
//         </div>

//     </div>
//   )
// }

// export default Products

import React, { useEffect, useRef, useState } from "react";
import useFetch from "../hook/useFetch.js";
import ProductCard from "./ProductCard";
import "../assets/styles/products.scss";

const Products = () => {
  const { state } = useFetch("products");
  const [time, setTime] = useState(new Date());
  console.log(state);
  

  const carouselRef = useRef(null);

  const scrollLeft = () => {
    carouselRef.current.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    carouselRef.current.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  };
  const format = (num) => (num < 10 ? `0${num}` : num);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="carousel-header">
        <div className="product-head">
          <h4 className="product-subtitle">
            <p/>Today's
          </h4>

          <div className="product-row">
            <div className="product-left">
              <h2 className="product-title">Flash Sales</h2>
              <div className="product-times">
                <div className="product-time--box">
                  <p>Days</p>
                  <h2>{format(time.getDate())}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Hours</p>
                  <h2>{format(time.getHours())}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Minutes</p>
                  <h2>{format(time.getMinutes())}</h2>
                </div>
                <span>:</span>
                <div className="product-time--box">
                  <p>Seconds</p>
                  <h2>{format(time.getSeconds())}</h2>
                </div>
              </div>
            </div>

            <div className="product-roles">
              <button onClick={scrollLeft}><i class="fa-solid fa-arrow-left"></i></button>
              <button onClick={scrollRight}><i class="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>
        </div>
      </div>

      <div className="product-cards" ref={carouselRef}>
        {state?.products?.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
      <div className="product-view--all">
        <button>View All Products</button>
      </div>
      <div className="product-line"></div>
    </div>
  );
};

export default Products;
