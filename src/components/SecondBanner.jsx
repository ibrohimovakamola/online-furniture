import React, { useEffect, useState } from "react";
import "../assets/styles/banner.scss";
import Sbanner from "../assets/images/sbanner.png";
import { Link } from "react-router-dom";

const SecondBanner = () => {
  const [time, setTime] = useState(new Date());
  const format = (num) => (num < 10 ? `0${num}` : num);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="container">
      <div className="sbanner">
        <div className="sbanner-info">
          <span>Categories</span>
          <h2 className="sbanner-title">Enhance Your Music Experience</h2>
          <div className="sbanner-times">
            <div className="sbanner-time--box">
              <h2>{format(time.getDate())}</h2>
              <p>Days</p>
            </div>
            <div className="sbanner-time--box">
              <h2>{format(time.getHours())}</h2>
              <p>Hours</p>
            </div>
            <div className="sbanner-time--box">
              <h2>{format(time.getMinutes())}</h2>
              <p>Minutes</p>
            </div>
            <div className="sbanner-time--box">
              <h2>{format(time.getSeconds())}</h2>
              <p>Seconds</p>
            </div>
          </div>
          <Link to="/products" className="sbanner-btn">Buy Now!</Link>
        </div>
        <div className="sbanner-img">
            <div className="sbanner-blur"></div>
          <img src={Sbanner} alt="" />
        </div>
      </div>
    </div>
  );
};

export default SecondBanner;
