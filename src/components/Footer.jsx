import React from "react";
import { Link } from "react-router-dom";
import "../assets/styles/footer.scss";
import QrCode from "../assets/images/qr.jpg"


const Footer = () => {
  const supports = [
    {
      title: "Lorem ipsum dolor sit amet consectetur adipisicing.",
    },
    {
      title: "exclusive@gmail.com",
    },
    {
      title: "+88015-88888-9999",
    },
  ];
  const accounts = [
    {
      title: "My account",
      path: "",
    },
    {
      title: "Login/Registr",
      path: "",
    },
    {
      title: "Cart",
      path: "",
    },
    {
      title: "Wishlist",
      path: "",
    },
    {
      title: "Shop",
      path: "",
    },
  ];
  const quickLinks = [
    {
      title: "Privacy Policy",
    },
    {
      title: "Terms of use",
    },
    {
      title: "FAQ",
    },
    {
      title: "Contact",
    },
  ];
  return (
    <div className="footer-wrapper">
      <div className="container">
        <div className="footer">
          <div className="footer-column">
            <h4 className="footer-logo">Exclusive</h4>
            <p className="footer-link">Subscribe</p>
            <p className="footer-link">Get 10% off your first order</p>
            <div className="footer-form">
              <input placeholder="Enter your email" type="text" />
              <button>
                <i class="fa-regular fa-paper-plane"></i>
              </button>
            </div>
          </div>
          <ul className="footer-column">
          <h4 className="footer-title">Support</h4>
            {supports.map((support) => {
              return <li className="footer-link">{support.title}</li>;
            })}
          </ul>
          <ul className="footer-column">
          <h4 className="footer-title">Account</h4>
            {accounts.map((account) => {
              return <Link className="footer-link">{account.title}</Link>;
            })}
          </ul>
          <ul className="footer-column">
          <h4 className="footer-title">Quick Link</h4>
            {quickLinks.map((link) => {
              return <Link className="footer-link">{link.title}</Link>;
            })}
          </ul>
          <div className="footer-column">
            <h4 className="footer-title">Download App</h4>
            <p className="footer-link--mini">Save 3% with App New User Only</p>
            <div className="footer-qr--block">
              <div className="footer-img">
              <img src={QrCode} alt="" />
              </div>
              
              <div className="footer-btns">
              <button><i class="fa-brands fa-google-play"></i>Google Play</button>
              <button><i class="fa-brands fa-apple"></i>App Store</button>
              </div>
              
            </div>
            <div className="footer-socials">
              <a href=""><i class="fa-brands fa-facebook-f"></i></a>
              <a href=""><i class="fa-brands fa-twitter"></i></a>
              <a href=""><i class="fa-brands fa-instagram"></i></a>
              <a href=""><i class="fa-brands fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
