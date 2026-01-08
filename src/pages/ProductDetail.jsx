import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import useFetch from "../hook/useFetch";
import ProductCard from "../components/ProductCard";
import BreadCrumbs from "../components/BreadCrumbs";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import "../assets/styles/product-detail.scss";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

const ProductDetail = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState(undefined);
  const { id } = useParams();
  const { state: data, loading } = useFetch(`products/${id}`);
  const { state } = useFetch("products");
  const relatedProducts = state?.products?.filter(
    (item) => item.category === data?.category
  );

  return (
    <div className="container">
      <div>
        <BreadCrumbs currentName={state?.title} />
        {loading || !data ? (
          <ProductDetailSkeleton />
        ) : (
          <div className="detail">
            <div className="wrapperr">
              <Swiper
                spaceBetween={8}
                navigation
                thumbs={{ swiper: thumbsSwiper }}
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper2"
              >
                {data?.images?.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img src={img} alt={`Slide ${index + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={2}
                slidesPerView={4}
                freeMode
                watchSlidesProgress
                modules={[FreeMode, Navigation, Thumbs]}
                className="mySwiper"
              >
                {data?.images?.map((img, index) => (
                  <SwiperSlide key={index} className="active">
                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="detail-info">
              <h4 className="detail-title">{data?.title}</h4>
              <div className="detail-rating">
                <div>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                </div>
                <p>({data?.reviews.length} Reviews)</p>
                <p className="detail-column"> </p>
                <span>In Stock</span>
              </div>
              <p className="detail-price">${data?.price}</p>
              <p className="detail-description">{data?.description}</p>
              <div className="detail-line"></div>
              <div className="detail-row">
                <div className="detail-count">
                  <button className="detail-minus">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <input type="text" value={1} />
                  <button className="detail-plus">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
                <button className="detail-buying">Buy Now</button>
                <button className="detail-wishlist">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <div className="detail-delivery--wrapper">
                <div className="detail-delivery">
                  <i class="fa-regular fa-truck"></i>
                  <div>
                    <h4>Free Delivery</h4>
                    <p>Enter your postal code for Delivery Availability</p>
                  </div>
                </div>
                <div className="detail-delivery--line"></div>
                <div className="detail-delivery">
                  <i class="fa-solid fa-arrow-rotate-left"></i>
                  <div>
                    <h4>Return Delivery</h4>
                    <p>Free 30 Days Delivery Returns. Details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="detail-related">
          <div className="detail-related--row">
            <p className="detail-mark"></p>
            <h4 className="detail-related--title">Related Item</h4>
          </div>
          <div className="detail-products">
            {relatedProducts?.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
