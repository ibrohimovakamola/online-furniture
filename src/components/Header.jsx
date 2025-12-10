import React from "react";
import "../assets/styles/header.scss";
import { Link, NavLink } from "react-router-dom";

const Header = () => {

  const menus = [
    {
      title: "Home",
      path: "/"
    },
    {
      title: "Contact",
      path: "/contact"
    },
    {
      title: "About",
      path: "/about"
    },
    {
      title: "Sign Up",
      path: "/sign-up"
    },
    {
      title: "Products",
      path: "/products"
    },
  ]


  return (
    <div>
 <div className="container">
      <div className="header">
        <Link to='/' className="header-logo">Exclusive</Link>
        <ul className="header-menus">
          {
            menus.map(((menu, i)=>{
              return <NavLink key={menu.i} to={menu.path} className='header-menu'>
                {menu.title}
              </NavLink>
            }))
          }
        </ul>
        <div className="header-info">
          <form className="header-form">
            <input className="header-form--input" placeholder="What are you looking for?" type="text" />
            <button className="header-form--btn"><i class="fa-solid fa-magnifying-glass"></i></button>
          </form>
          <Link to='/favourites' className="header-wishlist"><i class="fa-regular fa-heart"></i>
          </Link>
          <Link to="/cart" className="header-cart">
            <i class="fa-solid fa-cart-shopping"></i>
          </Link>
        </div>
      </div>
    </div>
    <div className="header-line"></div>
    </div>
   
  );
};

export default Header;
