import React from "react";
import { Link } from "react-router-dom";
import SignImg from "../assets/images/signUp.jpg";
import "../assets/styles/sign-up.scss";
import GoogleIcon from "../assets/images/Icon-Google.png"

const SignUp = () => {
  return (
    <div className="sign-wrapper">
      <div className="container">
        <div className="sign">
          <div className="sign-img">
            <img src={SignImg} alt="" />
          </div>
          <div className="sign-form">
            <h2 className="sign-title">Create an account</h2>
            <p className="sign-text">Enter your details below</p>

            <input placeholder="Name" type="text" />

            <input placeholder="Email or phone number" type="text" />

            <input placeholder="Password" type="text" />

            <button className="sign-btn--red">Create account</button>
            <button className="sign-btn"><img src={GoogleIcon} alt="" /> Sign up with Google</button>
            <p className="sign-enter--text">
              Already have account? <Link to="">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
