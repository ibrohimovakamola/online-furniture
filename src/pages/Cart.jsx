import React from "react";
import { useSelector } from "react-redux";
import "../assets/styles/cart.scss";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);
  console.log(cartItems);

  return (
    <div className="container">
      <div className="cart">
        <div className="cart-route">
          <h4 className="cart-route--title cart-start">Product</h4>
          <h4 className="cart-route--title">Price</h4>
          <h4 className="cart-route--title">Quantity</h4>
          <h4 className="cart-route--title cart-end">Subtotal</h4>
        </div>
        <div className="cart-wrapper">
          {cartItems.map((item) => {
            return (
              <div className="cart-box">
                <div className="cart-info">
                  <div className="cart-delete">
                    <i class="fa-solid fa-circle-xmark"></i>
                  </div>

                  <img src={item.thumbnail} alt="" />
                  <h4>{item.title} </h4>
                </div>
                <p className="cart-price">${item.price}</p>
                <div className="cart-count">
                  <div className="cart-couter-wrapper">
                    <p>02</p>
                    <div className="cart-counter">
                      <button>
                        <i class="fa-solid fa-angle-up"></i>
                      </button>
                      <button>
                        <i class="fa-solid fa-angle-down"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <p className="cart-price--end">${item.price}</p>
              </div>
            );
          })}
        </div>
        <div className="cart-proccess">
            <button>Return To Shop</button>
            <button>Update Cart</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
