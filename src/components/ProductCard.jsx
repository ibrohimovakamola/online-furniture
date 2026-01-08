import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import "../assets/styles/product-card.scss";
import { Link } from "react-router-dom";
import { addToFavourite } from "../features/favourite/favourite";
import Modal from "./Modal";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const [modal, setModal] = useState({
    open: false,
    text: "",
    icon: "",
  });

  const isInCart = useSelector((state) =>
    state.cart.items.some((item) => item.id === product.id)
  );

  const isFavorite = useSelector((state) =>
    state.favourite.items.some((fav) => fav.id === product.id)
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
    setModal({
      open: true,
      text: "Product successfully added to cart",
      icon: "fa-regular fa-circle-check",
    });
    setTimeout(() => {
      setModal({ open: false, text: "", icon: "" });
    }, 2000);
  };

  const handleAddToFavourite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToFavourite({ ...product, quantity: 1 }));

    setModal({
      open: true,
      text: "Product successfully added to favorites",
      icon: "fa-solid fa-heart",
    });
    setTimeout(() => {
      setModal({ open: false, text: "", icon: "" });
    }, 2000);
  };
  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card-img">
        <img src={product.thumbnail} alt="" />
        <button className="card-disc">-{product.discountPercentage}%</button>
        <div className="card-actions">
          <button onClick={handleAddToFavourite}>
            <i
              class={isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}
            ></i>
          </button>
          <button>
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          className="card-add--tocart"
          disabled={isInCart}
        >
          {isInCart ? "Added" : "Add to Cart"}
        </button>
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
      {modal.open && <Modal text={modal.text} icon={modal.icon} />}
    </Link>
  );
};

export default ProductCard;
