import React, { useEffect, useState } from "react";
import Products from "../components/Products";
import useFetch from "../hook/useFetch";
import ProductCard from "../components/ProductCard";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import BreadCrumbs from "../components/BreadCrumbs";

const Product = () => {
  const { state } = useFetch("products");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (state?.products?.length) {
      setLoading(false);
    }
  }, [state]);
  
  return (
    <div className="container">
      <div> 
        <BreadCrumbs/>
        {/* {loading ? (
          Array(8)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="skeleton-product">
                <Skeleton height={270} />
                <Skeleton width={"100%"} height={25} />
                <Skeleton width={"80%"} height={25} />
                <Skeleton width={"100%"} height={25} />
              </div>
            ))
        ) : (
          <div className="product-page--cards">
            {state?.products?.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )} */}
        {loading ? (
          <div className="product-page--cards">
            {Array(12)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="skeleton-card">
                  <Skeleton className="skeleton-img" />
                  <Skeleton className="skeleton-line" />
                  <Skeleton className="skeleton-line short" />
                  <Skeleton className="skeleton-line" />
                </div>
              ))}
          </div>
        ) : (
          <div className="product-page--cards">
            {state?.products?.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
