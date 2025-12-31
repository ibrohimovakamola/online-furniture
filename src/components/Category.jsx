import React, { useRef } from "react";
import "../assets/styles/category.scss";

const Category = () => {
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
  const categoryList = [
    {
      img: "fa-solid fa-mobile-screen-button",
      name: "Phones",
    },
    {
      img: "fa-solid fa-desktop",
      name: "Computers",
    },
    {
      img: "fa-regular fa-camera",
      name: "Camera",
    },
    {
      img: "fa-regular fa-camera",
      name: "Camera",
    },
    {
      img: "fa-regular fa-headphones",
      name: "Headphones",
    },
    {
      img: "fa-solid fa-gamepad",
      name: "Gaming",
    },
    {
      img: "fa-regular fa-camera",
      name: "Camera",
    },
    {
      img: "fa-regular fa-headphones",
      name: "Headphones",
    },
    {
      img: "fa-solid fa-gamepad",
      name: "Gaming",
    },
  ];
  return (
    <div className="container">
      <div className="category">
        <div className="carousel-header">
          <div className="product-head">
            <h4 className="product-subtitle">
              <p />
              Categories
            </h4>

            <div className="product-row">
              <div className="product-left">
                <h2 className="product-title">Browse By Category</h2>
              </div>

              <div className="product-roles">
                <button onClick={scrollLeft}>
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <button onClick={scrollRight}>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="category-row" ref={carouselRef}>
            {
                categoryList.map((category)=>{
                    return <div className="category-card">
                        <i className={category.img}/>
                        <p>{category.name}</p>
                    </div>
                })
            }
        </div>
        <div className="category-line"></div>
      </div>
    </div>
  );
};

export default Category;
