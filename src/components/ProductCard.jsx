import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import "../assets/styles/product-card.scss";
import { Link } from "react-router-dom";
import { addToFavourite } from "../features/favourite/favourite";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const isFavorite = useSelector((state) =>
    state.favourite.items.some((fav) => fav.id === product.id)
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
  };
  const handleAddToFavourite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToFavourite({ ...product, quantity: 1 }));
  };



  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card-img">
        <img src={product.thumbnail} alt="" />
        <button className="card-disc">-{product.discountPercentage}%</button>
        <div className="card-actions">
          <button onClick={handleAddToFavourite}>
            <i class={isFavorite ? "fa-solid fa-heart" :"fa-regular fa-heart"}></i>
          </button>
          <button>
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
        <button onClick={handleAddToCart} className="card-add--tocart">Add to Card</button>
      </div>
      <div className="card-info">
        <h4 className="card-title">{product.title}</h4>
        <span className="card-price">${product.price}</span>
        <div className="card-rating">
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <p>({product.stock})</p>
          
        </div>
      </div>
      {/* <button onClick={handleAddToCart}>Add to cart</button> */}
    </Link>
  );
};

export default ProductCard;
