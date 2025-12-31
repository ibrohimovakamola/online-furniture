import React from 'react'
import Products from '../components/Products'
import useFetch from '../hook/useFetch';
import ProductCard from '../components/ProductCard';

const Product = () => {
  const { state } = useFetch("products");
  return (
    <div className='container'>
        {/* <Products/> */}
        <div>
        <div className="product-page--cards">
        {state?.products?.map((item) => (
           <ProductCard key={item.id} product={item} />
         
        ))}
      </div>
        </div>
    </div>
  )
}

export default Product