import React from "react";
import "../assets/styles/favourite.scss";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";

const Fovourites = ({product}) => {
  const dispatch = useDispatch();
  const favouriteItems = useSelector((state) => state.favourite.items);
  const favouriteItem = useSelector((state) => state.favourite.items);
  const favouriteCount = favouriteItem.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleAddToCart = (e)=>{
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
  }

  return (
    <div className="container">
      <div className="favourite">
        {favouriteCount > 0 ? (
          <div>
            <div className="favourite-row">
              <h4 className="favourite-title">Wishlist ({favouriteCount})</h4>
              <button className="favourite-btn">Move All To Bag</button>
            </div>
            <div className="favourite-card--wrapper ">
              {favouriteItems.map((item) => {
                return (
                  <div className="favourite-card">
                    <div className="favourite-img">
                      <button className="favourite-bin">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                      <img src={item.thumbnail} alt="" />
                      <button onClick={handleAddToCart} className="favourite-add--cart">
                        <i className="fa-solid fa-cart-shopping"></i>Add To Cart
                      </button>
                    </div>
                    <h4 className="favourite-card--title">{item.title}</h4>
                    <p className="favourite-price">${item.price}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>hello</div>
        )}
      </div>
    </div>
  );
};

export default Fovourites;
