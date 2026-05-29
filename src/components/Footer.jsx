import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "../assets/styles/footer.scss";
import QrCode from "../assets/images/qr.jpg";
import { selectSettings } from "../features/settings/settingsSlice";

const Footer = () => {
  const settings = useSelector(selectSettings);
  const store = settings?.store;

  const supports = [
    { title: store?.address || "Tashkent, Uzbekistan" },
    { title: store?.storeEmail || "exclusive@gmail.com" },
    { title: store?.supportPhone || "+998 94 043 16 84" },
  ];

  const accounts = [
    { title: "My account", path: "/sign-up" },
    { title: "Login / Register", path: "/login" },
    { title: "Cart", path: "/cart" },
    { title: "Wishlist", path: "/favourites" },
    { title: "Shop", path: "/products" },
  ];

  const quickLinks = [
    { title: "Privacy Policy", path: "/about" },
    { title: "Terms of use", path: "/about" },
    { title: "FAQ", path: "/contact" },
    { title: "Contact", path: "/contact" },
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
              <button type="button">
                <i className="fa-regular fa-paper-plane" />
              </button>
            </div>
          </div>
          <ul className="footer-column">
            <h4 className="footer-title">Support</h4>
            {supports.map((support, i) => (
              <li key={i} className="footer-link">{support.title}</li>
            ))}
          </ul>
          <ul className="footer-column">
            <h4 className="footer-title">Account</h4>
            {accounts.map((account) => (
              <Link key={account.title} to={account.path} className="footer-link">{account.title}</Link>
            ))}
          </ul>
          <ul className="footer-column">
            <h4 className="footer-title">Quick Link</h4>
            {quickLinks.map((link) => (
              <Link key={link.title} to={link.path} className="footer-link">{link.title}</Link>
            ))}
          </ul>
          <div className="footer-column">
            <h4 className="footer-title">Download App</h4>
            <p className="footer-link--mini">Save 3% with App New User Only</p>
            <div className="footer-qr--block">
              <div className="footer-img">
                <img src={QrCode} alt="QR code" />
              </div>
              <div className="footer-btns">
                <button type="button"><i className="fa-brands fa-google-play" />Google Play</button>
                <button type="button"><i className="fa-brands fa-apple" />App Store</button>
              </div>
            </div>
            <div className="footer-socials">
              {store?.instagram ? (
                <a href={store.instagram} target="_blank" rel="noreferrer"><i className="fa-brands fa-instagram" /></a>
              ) : (
                <a href="/"><i className="fa-brands fa-instagram" /></a>
              )}
              {store?.telegram ? (
                <a href={store.telegram} target="_blank" rel="noreferrer"><i className="fa-brands fa-telegram" /></a>
              ) : (
                <a href="/"><i className="fa-brands fa-telegram" /></a>
              )}
              <a href="/"><i className="fa-brands fa-facebook-f" /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
