import React from "react";
import { useDispatch, useSelector } from "react-redux";
import "../assets/styles/cart.scss";
import { removeFromCart } from "../features/cart/cartSlice";
import { Link } from "react-router-dom";
import BreadCrumbs from "../components/BreadCrumbs";

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const cartItem = useSelector((state) => state.cart.items);
  const cartCount = cartItem.reduce((total, item) => total + item.quantity, 0);
  console.log(cartItems);

  return (
    <div className="container">
      <div>
        <BreadCrumbs/>
        {cartCount > 0 ? (
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
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="cart-delete"
                      >
                        <i class="fa-solid fa-circle-xmark"></i>
                      </button>

                      <img src={item.thumbnail} alt="" />
                      <h4>{item.title} </h4>
                    </div>
                    <p className="cart-price">${item.price}</p>
                    <div className="cart-count">
                      <div className="cart-couter-wrapper">
                        <p>{item.quantity}</p>
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
            <div className="cart-payment">
              <div className="cart-payment--form">
                <input placeholder="Coupon Code" type="text" />
                <button>Apply Coupon</button>
              </div>
              <div className="cart-payment--card">
                <h4>Cart Total</h4>
                <div className="cart-payment--row">
                  <p>Subtotal</p>
                  <p>$1750</p>
                </div>
                <div className="cart-payment--line"></div>
                <div className="cart-payment--row">
                  <p>Subtotal</p>
                  <p>$1750</p>
                </div>
                <div className="cart-payment--line"></div>
                <div className="cart-payment--row">
                  <p>Subtotal</p>
                  <p>$1750</p>
                </div>
                <div className="cart-payment--btn">
                  <button>Process to checkout</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-card extra">
            <i class="fa-solid fa-cart-shopping"></i>
            <p className="empty-text">The basket is empty</p>
            <Link to="/products" className="empty-btn">
              Go to products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
