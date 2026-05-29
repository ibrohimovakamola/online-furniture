import React from "react";
import "../assets/styles/header.scss";
import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import exclusiveLogo from "../assets/images/logo1.jpg";

const Header = () => {
  const { t } = useTranslation();
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.length;
  const favouriteItem = useSelector((state) => state.favourite.items);
  const favouriteCount = favouriteItem.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const menus = [
    {
      title: t("home"),
      path: "/",
    },
    {
      title: t("contact"),
      path: "/contact",
    },
    {
      title: t("about"),
      path: "/about",
    },
    {
      title: t("sign"),
      path: "/sign-up",
    },
  ];

  return (
    <div>
      <div className="container">
        <div className="header">
          <Link to="/" className="header-logo shrink-0">
            <img
              src={exclusiveLogo}
              alt="Exclusive Logo"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <ul className="header-menus">
            {menus.map((menu, i) => {
              return (
                <NavLink key={menu.i} to={menu.path} className="header-menu">
                  {menu.title}
                </NavLink>
              );
            })}
          </ul>
          <div className="header-info">
            <form className="header-form">
              <input
                className="header-form--input"
                placeholder="What are you looking for?"
                type="text"
              />
              <button className="header-form--btn">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>
            <Link to="/favourites" className="header-wishlist">
              <i className="fa-regular fa-heart"></i>
              {favouriteCount > 0 && (
                <span className="header-mark">{favouriteCount}</span>
              )}
            </Link>
            <Link to="/cart" className="header-cart">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && (
                <span className="header-mark">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
      <div className="header-line"></div>
    </div>
  );
};

export default Header;
